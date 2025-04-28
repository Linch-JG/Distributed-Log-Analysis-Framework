package com.log.Linch_JG.log.analysis.controller;

import com.log.Linch_JG.log.analysis.model.Log;
import com.log.Linch_JG.log.analysis.service.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            @RequestParam(required = false) String server_id,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long from,
            @RequestParam(required = false) Long to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        return new ResponseEntity<>(logService.getLogs(server_id, type, from, to, page, pageSize), HttpStatus.OK);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Log> getLogById(@PathVariable String id) {
        Optional<Log> log = logService.getLogById(id);
        return log.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
    
    @PostMapping
    public ResponseEntity<Log> createLog(@RequestBody Log log) {
        return new ResponseEntity<>(logService.saveLog(log), HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Log> updateLog(@PathVariable String id, @RequestBody Log log) {
        if (!logService.getLogById(id).isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        log.setId(id); 
        return new ResponseEntity<>(logService.saveLog(log), HttpStatus.OK);
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
