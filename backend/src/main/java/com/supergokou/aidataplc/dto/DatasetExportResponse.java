package com.supergokou.aidataplc.dto;

import com.supergokou.aidataplc.domain.DatasetFormat;
import java.time.Instant;
import java.util.List;

public record DatasetExportResponse(
    String jobId,
    DatasetFormat format,
    String status,
    List<String> batchIds,
    Instant createdAt,
    String downloadPath
) {}
