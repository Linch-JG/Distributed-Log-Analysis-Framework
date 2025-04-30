package mongo

import (
	"context"
	"time"

	"github.com/Linch-JG/Distributed-Log-Analysis-Framework/analyzer/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Client struct {
	client     *mongo.Client
	database   *mongo.Database
	collection *mongo.Collection
}

func NewClient(uri, dbName, collectionName string) (*Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		return nil, err
	}

	database := client.Database(dbName)
	collection := database.Collection(collectionName)

	return &Client{
		client:     client,
		database:   database,
		collection: collection,
	}, nil
}

func (c *Client) Close(ctx context.Context) error {
	return c.client.Disconnect(ctx)
}

func (c *Client) StoreReduceOutputs(ctx context.Context, outputs []models.ReduceOutput) error {
	if len(outputs) == 0 {
		return nil
	}

	operations := make([]mongo.WriteModel, 0, len(outputs))
	now := time.Now()

	for _, output := range outputs {
		output.UpdatedAt = now

		filter := bson.M{
			"server_id": output.ServerID,
			"type":      output.Type,
			"value":     output.Value,
		}

		update := bson.M{
			"$set": bson.D{
				{Key: "server_id", Value: output.ServerID},
				{Key: "type", Value: output.Type},
				{Key: "value", Value: output.Value},
				{Key: "updated_at", Value: now},
			},
			"$inc":         bson.M{"count": output.Count},
			"$setOnInsert": bson.M{"created_at": now},
		}

		operation := mongo.NewUpdateOneModel().
			SetFilter(filter).
			SetUpdate(update).
			SetUpsert(true)

		operations = append(operations, operation)
	}

	opts := options.BulkWrite().SetOrdered(false)
	_, err := c.collection.BulkWrite(ctx, operations, opts)
	return err
}

func (c *Client) GetTopIPs(ctx context.Context, limit int) ([]models.ReduceOutput, error) {
	filter := bson.M{"type": models.AggregationIP}
	return c.getTopByFilter(ctx, filter, limit)
}

func (c *Client) GetTopEndpoints(ctx context.Context, limit int) ([]models.ReduceOutput, error) {
	filter := bson.M{"type": models.AggregationEndpoint}
	return c.getTopByFilter(ctx, filter, limit)
}

func (c *Client) getTopByFilter(ctx context.Context, filter bson.M, limit int) ([]models.ReduceOutput, error) {
	opts := options.Find().
		SetSort(bson.M{"count": -1}).
		SetLimit(int64(limit))

	cursor, err := c.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []models.ReduceOutput
	err = cursor.All(ctx, &results)
	return results, err
}
