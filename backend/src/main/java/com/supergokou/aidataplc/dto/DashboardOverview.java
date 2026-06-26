package com.supergokou.aidataplc.dto;

public record DashboardOverview(
    int activeBatches,
    int configuredPoints,
    int onlineDevices,
    int activeAlerts,
    int realtimeDelaySeconds,
    String aiControlMode
) {}
