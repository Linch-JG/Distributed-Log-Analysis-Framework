package grouper

import "github.com/Linch-JG/Distributed-Log-Analysis-Framework/analyzer/internal/models"

func GroupByKey(batch []models.MapOutput) map[models.MapKey][]models.MapOutput {
	grouped := make(map[models.MapKey][]models.MapOutput)
	for _, m := range batch {
		key := models.MapKey{
			ServerID: m.ServerID,
			Type:     m.Type,
			Value:    m.Value,
		}
		grouped[key] = append(grouped[key], m)
	}
	return grouped
}
