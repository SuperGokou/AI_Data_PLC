package com.supergokou.aidataplc.domain;

public record ModelProviderSetting(
    String providerId,
    String displayName,
    String baseUrl,
    String modelName,
    boolean configured,
    boolean enabled,
    boolean industrialAlgorithmCapable,
    String source,
    String apiKeyFingerprint
) {}
