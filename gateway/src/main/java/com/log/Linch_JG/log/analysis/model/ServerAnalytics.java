package com.log.Linch_JG.log.analysis.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServerAnalytics {
    private List<IpCount> ips;
    private List<EndpointCount> endpoints;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IpCount {
        private String address;
        private int count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EndpointCount {
        private String endpoint;
        private int count;
    }
}
