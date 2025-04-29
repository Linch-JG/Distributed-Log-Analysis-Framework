package com.log.Linch_JG.log.analysis.service;

import com.log.Linch_JG.log.analysis.model.Log;
import com.log.Linch_JG.log.analysis.model.ServerAnalytics;

import java.util.Date;
import java.util.List;
import java.util.Map;

public interface LogAnalysisService {
    List<Log> getAllLogs();
    List<Log> getLogsByTimeRange(Date startTime, Date endTime);
    Log saveLog(Log log);
    List<Log> saveAllLogs(List<Log> logs);
    Map<String, Integer> getMostActiveIPs();
    Map<String, Integer> getMostAccessedEndpoints();
    Map<String, ServerAnalytics> getGroupedAnalytics();
}
