package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Linch-JG/Distributed-Log-Analysis-Framework/analyzer/internal/grouper"
	"github.com/Linch-JG/Distributed-Log-Analysis-Framework/analyzer/internal/mapper"
	"github.com/Linch-JG/Distributed-Log-Analysis-Framework/analyzer/internal/models"
	"github.com/Linch-JG/Distributed-Log-Analysis-Framework/analyzer/internal/mongo"
	"github.com/Linch-JG/Distributed-Log-Analysis-Framework/analyzer/internal/parser"
	"github.com/Linch-JG/Distributed-Log-Analysis-Framework/analyzer/internal/reducer"

	"github.com/streadway/amqp"
)

// getEnv retrieves environment variable or uses default value if not set
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func main() {
	// Setup signal handling for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Create a channel to listen for OS signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Go routine to handle shutdown signals
	go func() {
		sig := <-sigChan
		log.Printf("Received signal: %s, initiating shutdown", sig)
		cancel()
	}()

	// Get configuration from environment variables
	rabbitMQHost := getEnv("RABBITMQ_HOST", "localhost")
	rabbitMQPort := getEnv("RABBITMQ_PORT", "5672")
	rabbitMQUser := getEnv("RABBITMQ_USER", "guest")
	rabbitMQPassword := getEnv("RABBITMQ_PASSWORD", "guest")
	rabbitMQQueue := getEnv("RABBITMQ_QUEUE", "logs")

	mongoURI := getEnv("MONGO_URI", "mongodb://localhost:27017")
	mongoDBName := getEnv("MONGO_DATABASE", "logs_analysis_db")
	mongoCollection := getEnv("MONGO_COLLECTION", "logs_analysis")

	// Build RabbitMQ connection URI
	rabbitMQURI := fmt.Sprintf("amqp://%s:%s@%s:%s/",
		rabbitMQUser, rabbitMQPassword, rabbitMQHost, rabbitMQPort)

	log.Printf("RabbitMQ URI: %s", rabbitMQURI)
	log.Printf("MongoDB URI: %s", mongoURI)

	// Connect to MongoDB
	mongoClient, err := mongo.NewClient(mongoURI, mongoDBName, mongoCollection)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer func() {
		if err := mongoClient.Close(context.Background()); err != nil {
			log.Printf("Error closing MongoDB connection: %v", err)
		}
	}()
	log.Println("Connected to MongoDB")

	// Connect to RabbitMQ
	conn, err := amqp.Dial(rabbitMQURI)
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	defer conn.Close()
	log.Println("Connected to RabbitMQ")

	// Create a channel
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a channel: %v", err)
	}
	defer ch.Close()

	// Declare a queue
	q, err := ch.QueueDeclare(
		rabbitMQQueue, // name
		true,          // durable
		false,         // delete when unused
		false,         // exclusive
		false,         // no-wait
		nil,           // arguments
	)
	if err != nil {
		log.Fatalf("Failed to declare a queue: %v", err)
	}

	// Set up consumer
	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		log.Fatalf("Failed to register a consumer: %v", err)
	}

	// Channels for MapReduce pipeline
	mapOutputCh := make(chan models.MapOutput, 1000)
	reduceOutputCh := make(chan models.ReduceOutput, 1000)

	// Start MapReduce pipeline
	go processMapOutputs(ctx, mapOutputCh, reduceOutputCh)
	go storeReduceOutputs(ctx, mongoClient, reduceOutputCh)

	// Start consuming messages
	log.Println("Waiting for messages. To exit press CTRL+C")
	for {
		select {
		case <-ctx.Done():
			log.Println("Shutting down...")
			return
		case msg, ok := <-msgs:
			if !ok {
				log.Println("RabbitMQ channel closed")
				return
			}
			// Process the message
			logLine := string(msg.Body)
			log.Printf("Received message: %s", logLine)

			// For simplicity, using a constant server ID, but in real world application
			// this could be extracted from the message properties or headers
			serverID := "server1"

			logEntry, err := parser.ParseRawLog(logLine, serverID)
			if err != nil {
				log.Printf("Error parsing log: %v", err)
				continue
			}

			// Apply map function to get map outputs
			mapOutputs := mapper.Map(logEntry)
			for _, output := range mapOutputs {
				select {
				case mapOutputCh <- output:
				case <-ctx.Done():
					return
				}
			}
		}
	}
}

// processMapOutputs groups map outputs by key and applies the reducer function
func processMapOutputs(ctx context.Context, mapOutputCh <-chan models.MapOutput, reduceOutputCh chan<- models.ReduceOutput) {
	// Buffer for batching the map outputs
	mapOutputsBatch := make([]models.MapOutput, 0, 1000)
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case mapOutput := <-mapOutputCh:
			mapOutputsBatch = append(mapOutputsBatch, mapOutput)
		case <-ticker.C:
			if len(mapOutputsBatch) == 0 {
				continue
			}

			// Group the batch by key
			groupedOutputs := grouper.GroupByKey(mapOutputsBatch)

			// Apply reducer for each group
			for key, group := range groupedOutputs {
				reduceOutput := reducer.ReduceGroup(key, group)
				select {
				case reduceOutputCh <- reduceOutput:
				case <-ctx.Done():
					return
				}
			}

			// Reset the batch
			mapOutputsBatch = mapOutputsBatch[:0]
		}
	}
}

// storeReduceOutputs collects reduce outputs and periodically stores them in MongoDB
func storeReduceOutputs(ctx context.Context, mongoClient *mongo.Client, reduceOutputCh <-chan models.ReduceOutput) {
	reduceOutputsBatch := make([]models.ReduceOutput, 0, 1000)
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			// Store any remaining outputs before shutting down
			if len(reduceOutputsBatch) > 0 {
				if err := mongoClient.StoreReduceOutputs(context.Background(), reduceOutputsBatch); err != nil {
					log.Printf("Error storing reduce outputs: %v", err)
				}
			}
			return
		case reduceOutput := <-reduceOutputCh:
			reduceOutputsBatch = append(reduceOutputsBatch, reduceOutput)
		case <-ticker.C:
			// Skip if no outputs to store
			if len(reduceOutputsBatch) == 0 {
				continue
			}

			// Store the batch in MongoDB
			if err := mongoClient.StoreReduceOutputs(ctx, reduceOutputsBatch); err != nil {
				log.Printf("Error storing reduce outputs: %v", err)
			} else {
				log.Printf("Stored %d reduce outputs in MongoDB", len(reduceOutputsBatch))
			}

			// Reset the batch
			reduceOutputsBatch = reduceOutputsBatch[:0]
		}
	}
}
