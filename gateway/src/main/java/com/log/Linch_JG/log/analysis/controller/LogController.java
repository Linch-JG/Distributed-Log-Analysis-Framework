package com.log.Linch_JG.log.analysis.controller;

import com.log.Linch_JG.log.analysis.model.Log;
import com.log.Linch_JG.log.analysis.service.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/logs")
public class LogController {
    
    private final LogService logService;
    
    @Autowired
    public LogController(LogService logService) {
        this.logService = logService;
    }
    
    @GetMapping
    public ResponseEntity<List<Log>> getAllLogs(
            @RequestParam(required = false) String serverId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long from,
            @RequestParam(required = false) Long to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        List<Log> logs = logService.getLogs(serverId, type, from, to, page, pageSize);
        
        for (Log log : logs) {
            if (log.getTimestamp() == null) {
                log.setTimestamp(new Date());
            }
        }
        
        return new ResponseEntity<>(logs, HttpStatus.OK);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Log> getLogById(@PathVariable String id) {
        Optional<Log> logOptional = logService.getLogById(id);
        
        if (logOptional.isPresent()) {
            Log log = logOptional.get();
            if (log.getTimestamp() == null) {
                log.setTimestamp(new Date());
                log = logService.saveLog(log); 
            }
            return new ResponseEntity<>(log, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
    
    @PostMapping
    public ResponseEntity<Log> createLog(@RequestBody Log log) {
        // Always set timestamp for new logs
        log.setTimestamp(new Date());
        Log savedLog = logService.saveLog(log);
        
        if (savedLog.getTimestamp() == null) {
            savedLog.setTimestamp(new Date());
            savedLog = logService.saveLog(savedLog);
        }
        
        return new ResponseEntity<>(savedLog, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Log> updateLog(@PathVariable String id, @RequestBody Log log) {
        Optional<Log> existingLogOpt = logService.getLogById(id);
        if (!existingLogOpt.isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        
        Log existingLog = existingLogOpt.get();
        log.setId(id);
        
        if (log.getTimestamp() == null) {
            if (existingLog.getTimestamp() != null) {
                log.setTimestamp(existingLog.getTimestamp());
            } else {
                log.setTimestamp(new Date());
            }
        }
        
        Log updatedLog = logService.saveLog(log);
        return new ResponseEntity<>(updatedLog, HttpStatus.OK);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLog(@PathVariable String id) {
        if (!logService.getLogById(id).isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        logService.deleteLog(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
