package parser

import (
	"fmt"
	"github.com/Linch-JG/Distributed-Log-Analysis-Framework/analyzer/internal/models"
	"regexp"
	"strconv"
	"time"
)

var logPattern = regexp.MustCompile(`^([\d\.]+) - \S+ \[([^\]]+)\] "([A-Z]+) ([^"]+) HTTP/\d\.\d" (\d{3}) \d+ "[^"]*" "([^"]+)"$`)

// Consider this nginx log format(in one line):
// 192.168.1.1 - - [22/Apr/2025:13:37:42 +0000]
// "GET /home HTTP/1.1" 200 532 "-" "Mozilla/5.0"

func ParseRawLog(line string, serverID string) (*models.Log, error) {
	matches := logPattern.FindStringSubmatch(line)

	const expectedGroups = 7
	if matches == nil || len(matches) != expectedGroups {
		return nil, fmt.Errorf("failed to parse log line: %s", line)
	}

	ip := matches[1]
	timeStr := matches[2]
	method := matches[3]
	endpoint := matches[4]
	statusStr := matches[5]
	userAgent := matches[6]

	// Parse timestamp
	timestamp, err := time.Parse("02/Jan/2006:15:04:05 -0700", timeStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse time: %w", err)
	}

	// Parse status code
	status, err := strconv.Atoi(statusStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse status code: %w", err)
	}

	return &models.Log{
		ServerID:  serverID,
		IP:        ip,
		Timestamp: timestamp,
		Method:    method,
		Endpoint:  endpoint,
		Status:    status,
		UserAgent: userAgent,
	}, nil
}
