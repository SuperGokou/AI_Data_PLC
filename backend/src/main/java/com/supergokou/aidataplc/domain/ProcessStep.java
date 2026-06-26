package com.supergokou.aidataplc.domain;

public record ProcessStep(
    int sequence,
    String workshop,
    String stepName,
    String controlPoint,
    String wipStatus,
    String systemAction,
    String equipment
) {}
