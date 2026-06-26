package com.supergokou.aidataplc.domain;

import java.time.Instant;

public record PlatformUser(
    String userId,
    String displayName,
    String username,
    String email,
    PlatformUserRole role,
    boolean enabled,
    String department,
    Instant createdAt,
    Instant lastLoginAt,
    String source,
    FrontendProfile frontendProfile
) {}
