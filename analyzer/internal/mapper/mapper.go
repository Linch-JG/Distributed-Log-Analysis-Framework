package mapper

import "github.com/Linch-JG/Distributed-Log-Analysis-Framework/analyzer/internal/models"

// Map function takes a log entry and returns a slice of MapOutput where we extract ip and endpoint
func Map(log *models.Log) []models.MapOutput {
	return []models.MapOutput{
		{
			ServerID: log.ServerID,
			Type:     models.AggregationIP,
			Value:    log.IP,
			Count:    1,
		},
		{
			ServerID: log.ServerID,
			Type:     models.AggregationEndpoint,
			Value:    log.Endpoint,
			Count:    1,
		},
	}
}
