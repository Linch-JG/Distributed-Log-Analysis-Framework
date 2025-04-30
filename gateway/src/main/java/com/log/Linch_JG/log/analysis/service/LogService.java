package com.log.Linch_JG.log.analysis.service;

import com.log.Linch_JG.log.analysis.model.Log;
import com.log.Linch_JG.log.analysis.repository.LogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class LogService {
    
    private final LogRepository logRepository;
    
    @Autowired
    public LogService(LogRepository logRepository) {
        this.logRepository = logRepository;
    }
    
    public Optional<Log> getLogById(String id) {
        return logRepository.findById(id);
    }
    
    public List<Log> getLogs() {
        return logRepository.findAll();
    }
    
    public Log saveLog(Log log) {
        return logRepository.save(log);
    }
    
    public void deleteLog(String id) {
        logRepository.deleteById(id);
    }
}
