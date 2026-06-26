package com.supergokou.aidataplc.dto;

import com.supergokou.aidataplc.domain.FrontendProfile;
import com.supergokou.aidataplc.domain.PlatformUser;

public record FrontendSession(
    String sessionType,
    PlatformUser user,
    FrontendProfile frontendProfile
) {}
