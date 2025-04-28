package com.log.Linch_JG.log.analysis.repository;

import com.log.Linch_JG.log.analysis.model.Log;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface LogRepository extends MongoRepository<Log, String> {
    List<Log> findByServerId(String serverId, Pageable pageable);
    List<Log> findByType(String type, Pageable pageable);
    List<Log> findByServerIdAndType(String serverId, String type, Pageable pageable);
    List<Log> findByTimestampBetween(Date from, Date to, Pageable pageable);
    List<Log> findByServerIdAndTimestampBetween(String serverId, Date from, Date to, Pageable pageable);
    List<Log> findByTypeAndTimestampBetween(String type, Date from, Date to, Pageable pageable);
    List<Log> findByServerIdAndTypeAndTimestampBetween(String serverId, String type, Date from, Date to, Pageable pageable);
}
