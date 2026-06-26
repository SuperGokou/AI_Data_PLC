package com.supergokou.aidataplc.controller;

import com.supergokou.aidataplc.domain.DatasetFormat;
import com.supergokou.aidataplc.dto.DatasetExportRequest;
import com.supergokou.aidataplc.dto.DatasetExportResponse;
import com.supergokou.aidataplc.service.DatasetService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/datasets")
public class DatasetController {

  private final DatasetService datasetService;

  public DatasetController(DatasetService datasetService) {
    this.datasetService = datasetService;
  }

  @GetMapping("/formats")
  public List<DatasetFormat> formats() {
    return datasetService.supportedFormats();
  }

  @PostMapping("/exports")
  public DatasetExportResponse createExport(@Valid @RequestBody DatasetExportRequest request) {
    return datasetService.createExport(request);
  }
}
