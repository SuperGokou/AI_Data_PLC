package com.supergokou.aidataplc.dto;

import jakarta.validation.constraints.NotNull;

public record ModelProviderEnabledRequest(@NotNull Boolean enabled) {}
