package com.supergokou.aidataplc.domain;

public record ControlPolicy(
    ControlMode mode,
    int realtimeDelaySeconds,
    boolean requireHumanApproval,
    boolean persistDecisionLog,
    String safetyNote
) {}
