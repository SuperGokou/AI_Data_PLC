package com.supergokou.aidataplc.controller;

import com.supergokou.aidataplc.config.PlcProperties;
import com.supergokou.aidataplc.dto.DashboardOverview;
import com.supergokou.aidataplc.service.SampleDataService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class DashboardController {

  private final PlcProperties properties;
  private final SampleDataService sampleDataService;

  public DashboardController(PlcProperties properties, SampleDataService sampleDataService) {
    this.properties = properties;
    this.sampleDataService = sampleDataService;
  }

  @GetMapping("/overview")
  public DashboardOverview overview() {
    return new DashboardOverview(
        sampleDataService.batches().size(),
        sampleDataService.points().size(),
        8,
        2,
        properties.getRealtimeDelaySeconds(),
        properties.getAiControlMode().name());
  }
}
