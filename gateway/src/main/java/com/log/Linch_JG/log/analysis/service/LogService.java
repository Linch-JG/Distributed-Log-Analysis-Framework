package com.log.Linch_JG.log.analysis.service;

import com.log.Linch_JG.log.analysis.model.Log;
import java.util.List;
import java.util.Optional;

public interface LogService {
    Optional<Log> getLogById(String id);
    List<Log> getLogs(String serverId, String type, Long from, Long to, int page, int pageSize);
    Log saveLog(Log log);
    void deleteLog(String id);
}
