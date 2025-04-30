package com.log.Linch_JG.log.analysis.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.Data;

import java.util.Date;

@Document(collection = "logs_analysis")
@Data
public class Log {
    @Id
    private String id;
    @Field("server_id")
    private String serverId;
    private String type;
    private String value;
    private Integer count;
    @Field("updated_at")
    private Date timestamp;
}
