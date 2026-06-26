package com.supergokou.aidataplc;

import com.supergokou.aidataplc.config.PlcProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(PlcProperties.class)
public class AiDataPlcApplication {

  public static void main(String[] args) {
    SpringApplication.run(AiDataPlcApplication.class, args);
  }
}
