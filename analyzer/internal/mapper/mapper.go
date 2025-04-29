package mapper

import "github.com/Linch-JG/Distributed-Log-Analysis-Framework/analyzer/internal/models"

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
