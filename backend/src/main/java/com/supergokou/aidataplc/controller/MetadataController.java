package com.supergokou.aidataplc.controller;

import com.supergokou.aidataplc.domain.BatchSnapshot;
import com.supergokou.aidataplc.domain.PointDefinition;
import com.supergokou.aidataplc.domain.ProcessStep;
import com.supergokou.aidataplc.service.SampleDataService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class MetadataController {

  private final SampleDataService sampleDataService;

  public MetadataController(SampleDataService sampleDataService) {
    this.sampleDataService = sampleDataService;
  }

  @GetMapping("/points")
  public List<PointDefinition> points() {
    return sampleDataService.points();
  }

  @GetMapping("/process-steps")
  public List<ProcessStep> processSteps() {
    return sampleDataService.processSteps();
  }

  @GetMapping("/batches")
  public List<BatchSnapshot> batches() {
    return sampleDataService.batches();
  }
}
