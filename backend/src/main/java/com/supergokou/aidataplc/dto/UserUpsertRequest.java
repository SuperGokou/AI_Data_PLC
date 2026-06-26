package com.supergokou.aidataplc.dto;

import com.supergokou.aidataplc.domain.PlatformUserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public record UserUpsertRequest(
    @NotBlank
    @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9-]{1,48}$",
        message = "userId must use letters, numbers, and hyphens")
    String userId,

    @NotBlank
    String displayName,

    @NotBlank
    @Pattern(regexp = "^[A-Za-z0-9._-]{2,64}$",
        message = "username must use letters, numbers, dots, underscores, or hyphens")
    String username,

    @NotBlank
    @Email
    String email,

    @NotNull
    PlatformUserRole role,

    @NotBlank
    String department,

    Boolean enabled,

    String frontendTheme,

    String frontendHomeView,

    List<String> frontendModules
) {}
