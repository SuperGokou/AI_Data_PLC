package com.supergokou.aidataplc.dto;

import com.supergokou.aidataplc.domain.DatasetFormat;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record DatasetExportRequest(
    @NotEmpty List<String> batchIds,
    @NotNull DatasetFormat format,
    boolean includeSpectrum,
    boolean includeWipEvents,
    boolean includeAiLabels
) {}
