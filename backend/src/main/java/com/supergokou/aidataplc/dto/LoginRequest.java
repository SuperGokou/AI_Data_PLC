package com.supergokou.aidataplc.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank String identifier) {}
