package com.supergokou.aidataplc.controller;

import java.util.Map;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class HomeController {

  @GetMapping("/")
  public String home() {
    return "redirect:/admin/index.html";
  }

  @GetMapping("/admin")
  public String admin() {
    return "redirect:/admin/index.html";
  }

  @GetMapping("/api/v1")
  @ResponseBody
  public Map<String, Object> apiInfo() {
    return Map.of(
        "service", "AI Data PLC Backend",
        "company", "\u65b9\u821f\u667a\u9020\uff08\u4e0a\u6d77\uff09",
        "status", "UP",
        "frontend", "https://ai-data-plc-frontend.onrender.com",
        "admin", "/admin/index.html",
        "endpoints", Map.of(
            "health", "/actuator/health",
            "authLogin", "/api/v1/auth/login",
            "overview", "/api/v1/overview",
            "users", "/api/v1/users",
            "providers", "/api/v1/models/providers",
            "datasets", "/api/v1/datasets/formats"));
  }
}
