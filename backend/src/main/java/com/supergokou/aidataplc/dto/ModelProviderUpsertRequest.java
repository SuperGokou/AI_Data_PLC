package com.supergokou.aidataplc.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.hibernate.validator.constraints.URL;

public record ModelProviderUpsertRequest(
    @NotBlank
    @Pattern(regexp = "^[a-z0-9][a-z0-9-]{1,48}$",
        message = "providerId must use lowercase letters, numbers, and hyphens")
    String providerId,

    @NotBlank
    String displayName,

    @NotBlank
    @URL
    String baseUrl,

    @NotBlank
    String modelName,

    @NotBlank
    String apiKey,

    boolean industrialAlgorithmCapable,
    Boolean enabled
) {}
