package com.supergokou.aidataplc.controller;

import com.supergokou.aidataplc.domain.PlatformUser;
import com.supergokou.aidataplc.dto.FrontendSession;
import com.supergokou.aidataplc.dto.LoginRequest;
import com.supergokou.aidataplc.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final UserManagementService userManagementService;

  public AuthController(UserManagementService userManagementService) {
    this.userManagementService = userManagementService;
  }

  @PostMapping("/login")
  public FrontendSession login(@Valid @RequestBody LoginRequest request) {
    PlatformUser user = userManagementService.loginFrontend(request.identifier());
    return new FrontendSession("FRONTEND_ACCOUNT", user, user.frontendProfile());
  }
}
