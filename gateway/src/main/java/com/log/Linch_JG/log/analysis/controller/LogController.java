package com.log.Linch_JG.log.analysis.controller;

import com.log.Linch_JG.log.analysis.model.Log;
import com.log.Linch_JG.log.analysis.service.LogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/logs")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE}, maxAge = 3600)
@Tag(name = "Log Management", description = "API endpoints for managing logs")
public class LogController {
    
    private final LogService logService;
    
    @Autowired
    public LogController(LogService logService) {
        this.logService = logService;
    }
    
    @Operation(summary = "Get all logs", description = "Retrieves logs with optional filtering by server ID, type, and date range")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved logs", 
                    content = @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = Log.class, type = "array")))
    })
    @GetMapping
    public ResponseEntity<List<Log>> getAllLogs() {
        List<Log> logs = logService.getLogs();
        return new ResponseEntity<>(logs, HttpStatus.OK);
    }
    
    @Operation(summary = "Get log by ID", description = "Retrieves a specific log by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved the log", 
                    content = @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = Log.class))),
        @ApiResponse(responseCode = "404", description = "Log not found", 
                    content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<Log> getLogById(
            @Parameter(description = "ID of the log to retrieve") @PathVariable String id) {
        Optional<Log> logOptional = logService.getLogById(id);
        
        if (logOptional.isPresent()) {
            Log log = logOptional.get();
            return new ResponseEntity<>(log, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
    
    @Operation(summary = "Create a new log", description = "Creates a new log entry")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Log successfully created", 
                    content = @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = Log.class)))
    })
    @PostMapping
    public ResponseEntity<Log> createLog(
            @Parameter(description = "Log object to be created", 
                      required = true, 
                      schema = @Schema(implementation = Log.class)) 
            @RequestBody Log log) {
        log.setTimestamp(new Date());
        Log savedLog = logService.saveLog(log);
        
        if (savedLog.getTimestamp() == null) {
            savedLog.setTimestamp(new Date());
            savedLog = logService.saveLog(savedLog);
        }
        
        return new ResponseEntity<>(savedLog, HttpStatus.CREATED);
    }
    
    @Operation(summary = "Update a log", description = "Updates an existing log by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Log successfully updated", 
                    content = @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = Log.class))),
        @ApiResponse(responseCode = "404", description = "Log not found", 
                    content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<Log> updateLog(
            @Parameter(description = "ID of the log to update") @PathVariable String id,
            @Parameter(description = "Updated log object", 
                      required = true, 
                      schema = @Schema(implementation = Log.class)) 
            @RequestBody Log log) {
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
    
    @Operation(summary = "Delete a log", description = "Deletes a log by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Log successfully deleted", 
                    content = @Content),
        @ApiResponse(responseCode = "404", description = "Log not found", 
                    content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLog(
            @Parameter(description = "ID of the log to delete") @PathVariable String id) {
        if (!logService.getLogById(id).isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        logService.deleteLog(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
