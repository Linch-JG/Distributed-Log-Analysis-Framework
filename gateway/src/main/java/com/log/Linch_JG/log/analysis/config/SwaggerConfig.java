package com.log.Linch_JG.log.analysis.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI logsOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Log Analysis API")
                        .description("API for managing and analyzing logs")
                        .version("v1.0.0"))
                .servers(List.of(
                        new Server().url("/").description("Default Server URL")
                ));
    }
}
