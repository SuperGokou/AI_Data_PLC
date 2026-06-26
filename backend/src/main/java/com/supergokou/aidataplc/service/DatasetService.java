package com.supergokou.aidataplc.service;

import com.supergokou.aidataplc.domain.DatasetFormat;
import com.supergokou.aidataplc.dto.DatasetExportRequest;
import com.supergokou.aidataplc.dto.DatasetExportResponse;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class DatasetService {

  public List<DatasetFormat> supportedFormats() {
    return Arrays.asList(DatasetFormat.values());
  }

  public DatasetExportResponse createExport(DatasetExportRequest request) {
    String jobId = "ds_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    String extension = switch (request.format()) {
      case CSV -> "csv";
      case JSON -> "json";
      case EXCEL -> "xlsx";
      case PARQUET -> "parquet";
      case REST_API -> "api";
      case DB_VIEW -> "view";
    };
    return new DatasetExportResponse(
        jobId,
        request.format(),
        "QUEUED",
        request.batchIds(),
        Instant.now(),
        "/api/datasets/exports/" + jobId + "." + extension);
  }
}
