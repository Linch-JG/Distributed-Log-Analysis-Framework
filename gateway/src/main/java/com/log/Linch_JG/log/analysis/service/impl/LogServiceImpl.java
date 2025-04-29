package com.log.Linch_JG.log.analysis.service.impl;

import com.log.Linch_JG.log.analysis.model.Log;
import com.log.Linch_JG.log.analysis.repository.LogRepository;
import com.log.Linch_JG.log.analysis.service.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LogServiceImpl implements LogService {
    
    private final LogRepository logRepository;
    
    @Autowired
    public LogServiceImpl(LogRepository logRepository) {
        this.logRepository = logRepository;
    }
    
    @Override
    public Optional<Log> getLogById(String id) {
        return logRepository.findById(id);
    }
    
    @Override
    public List<Log> getLogs(String serverId, String type, Long from, Long to, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);
        
        List<Log> result;
        
        if (serverId != null || type != null || (from != null && to != null)) {
            if (from != null && to != null) {
                if (serverId != null && type != null) {
                    result = logRepository.findByServerIdAndTypeAndTimestampBetween(
                        serverId, type, new java.util.Date(from), new java.util.Date(to), pageable);
                } else if (serverId != null) {
                    result = logRepository.findByServerIdAndTimestampBetween(
                        serverId, new java.util.Date(from), new java.util.Date(to), pageable);
                } else if (type != null) {
                    result = logRepository.findByTypeAndTimestampBetween(
                        type, new java.util.Date(from), new java.util.Date(to), pageable);
                } else {
                    result = logRepository.findByTimestampBetween(
                        new java.util.Date(from), new java.util.Date(to), pageable);
                }
            } else {
                if (serverId != null && type != null) {
                    result = logRepository.findByServerIdAndType(serverId, type, pageable);
                } else if (serverId != null) {
                    result = logRepository.findByServerId(serverId, pageable);
                } else {
                    result = logRepository.findByType(type, pageable);
                }
            }
        } else {
            result = logRepository.findAll(pageable).getContent();
        }
        
        return result;
    }
    
    @Override
    public Log saveLog(Log log) {
        return logRepository.save(log);
    }
    
    @Override
    public void deleteLog(String id) {
        logRepository.deleteById(id);
    }
}
