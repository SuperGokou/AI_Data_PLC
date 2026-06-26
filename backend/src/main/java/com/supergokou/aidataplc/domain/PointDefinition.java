package com.supergokou.aidataplc.domain;

public record PointDefinition(
    int orderNo,
    String fieldName,
    String displayName,
    String dataType,
    String unitOrFormat,
    String sampleValue,
    String source,
    String processStep,
    String note,
    boolean requiredForAiDataset
) {}
