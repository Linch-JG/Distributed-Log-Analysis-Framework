package models

import "time"

type Log struct {
	ServerID  string    `json:"server_id" bson:"server_id"`
	IP        string    `json:"ip" bson:"ip"`
	Timestamp time.Time `json:"timestamp" bson:"timestamp"`
	Method    string    `json:"method" bson:"method"`
	Endpoint  string    `json:"endpoint" bson:"endpoint"`
	Status    int       `json:"status" bson:"status"`
	UserAgent string    `json:"user_agent" bson:"user_agent"`
}

type AggregationType string

const (
	AggregationIP       AggregationType = "ip"
	AggregationEndpoint AggregationType = "endpoint"
)

type MapOutput struct {
	ServerID string          `json:"server_id" bson:"server_id"`
	Type     AggregationType `json:"type" bson:"type"`
	Value    string          `json:"value" bson:"value"`
	Count    int             `json:"count" bson:"count"`
}

type MapKey struct {
	ServerID string
	Type     AggregationType
	Value    string
}

type ReduceOutput struct {
	ServerID  string          `json:"server_id" bson:"server_id"`
	Type      AggregationType `json:"type" bson:"type"`
	Value     string          `json:"value" bson:"value"`
	Count     int             `json:"count" bson:"count"`
	CreatedAt time.Time       `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time       `json:"updated_at" bson:"updated_at"`
}
