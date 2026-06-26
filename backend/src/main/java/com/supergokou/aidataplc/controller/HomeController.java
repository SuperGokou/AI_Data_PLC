package com.supergokou.aidataplc.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

  @GetMapping("/")
  public Map<String, Object> home() {
    return Map.of(
        "service", "AI Data PLC Backend",
        "status", "UP",
        "frontend", "https://ai-data-plc-frontend.onrender.com",
        "endpoints", Map.of(
            "health", "/actuator/health",
            "overview", "/api/v1/overview",
            "providers", "/api/v1/models/providers",
            "datasets", "/api/v1/datasets/formats"));
  }
}
