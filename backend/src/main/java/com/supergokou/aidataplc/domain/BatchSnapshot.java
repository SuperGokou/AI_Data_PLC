package com.supergokou.aidataplc.domain;

import java.time.Instant;

public record BatchSnapshot(
    String batchId,
    String machineId,
    String fabricType,
    String currentStep,
    String wipStatus,
    double completionPct,
    Instant updatedAt,
    boolean datasetReady
) {}
