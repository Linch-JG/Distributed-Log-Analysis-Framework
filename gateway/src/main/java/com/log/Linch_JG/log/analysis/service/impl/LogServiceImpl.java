package com.log.Linch_JG.log.analysis.service.impl;

import com.log.Linch_JG.log.analysis.model.Log;
import com.log.Linch_JG.log.analysis.repository.LogRepository;
import com.log.Linch_JG.log.analysis.service.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Date;
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
    public List<Log> getLogs(String serverId, String type, Long from, Long to) {
        Date fromDate = from != null ? new Date(from) : null;
        Date toDate = to != null ? new Date(to) : null;

        if (serverId != null && type != null && fromDate != null && toDate != null) {
            return logRepository.findByServerIdAndTypeAndTimestampBetween(serverId, type, fromDate, toDate, Pageable.unpaged());
        } else if (serverId != null && type != null) {
            return logRepository.findByServerIdAndType(serverId, type, Pageable.unpaged());
        } else if (serverId != null && fromDate != null && toDate != null) {
            return logRepository.findByServerIdAndTimestampBetween(serverId, fromDate, toDate, Pageable.unpaged());
        } else if (type != null && fromDate != null && toDate != null) {
            return logRepository.findByTypeAndTimestampBetween(type, fromDate, toDate, Pageable.unpaged());
        } else if (serverId != null) {
            return logRepository.findByServerId(serverId, Pageable.unpaged());
        } else if (type != null) {
            return logRepository.findByType(type, Pageable.unpaged());
        } else if (fromDate != null && toDate != null) {
            return logRepository.findByTimestampBetween(fromDate, toDate, Pageable.unpaged());
        } else {
            return logRepository.findAll();
        }
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
