package models

import "time"

// Log - parsed log entry
type Log struct {
	ServerID  string    `json:"server_id" bson:"server_id"`
	IP        string    `json:"ip" bson:"ip"`
	Timestamp time.Time `json:"timestamp" bson:"timestamp"`
	Method    string    `json:"method" bson:"method"`
	Endpoint  string    `json:"endpoint" bson:"endpoint"`
	Status    int       `json:"status" bson:"status"`
	UserAgent string    `json:"user_agent" bson:"user_agent"`
}

// AggregationType - dimension by which we aggregate
type AggregationType string

const (
	AggregationIP       AggregationType = "ip"
	AggregationEndpoint AggregationType = "endpoint"
)

// MapOutput - result of the Map
type MapOutput struct {
	ServerID string          `json:"server_id" bson:"server_id"`
	Type     AggregationType `json:"type" bson:"type"`
	Value    string          `json:"value" bson:"value"`
	Count    int             `json:"count" bson:"count"`
}

// MapKey - key for grouping map outputs
type MapKey struct {
	ServerID string
	Type     AggregationType
	Value    string
}

// ReduceOutput - aggregation result
type ReduceOutput struct {
	CreatedAt time.Time       `json:"created_at" bson:"created_at"`
	ServerID  string          `json:"server_id" bson:"server_id"`
	Type      AggregationType `json:"type" bson:"type"`
	Value     string          `json:"value" bson:"value"`
	Count     int             `json:"count" bson:"count"`
	UpdatedAt time.Time       `json:"updated_at" bson:"updated_at"`
}
