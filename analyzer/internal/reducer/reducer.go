package reducer

import "github.com/Linch-JG/Distributed-Log-Analysis-Framework/internal/models"

func ReduceGroup(key models.MapKey, group []models.MapOutput) models.ReduceOutput {
	count := 0
	for _, m := range group {
		count += m.Count
	}
	return models.ReduceOutput{
		ServerID: key.ServerID,
		Type:     key.Type,
		Value:    key.Value,
		Count:    count,
	}
}
