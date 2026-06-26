package com.supergokou.aidataplc.controller;

import com.supergokou.aidataplc.domain.PlatformUser;
import com.supergokou.aidataplc.dto.UserEnabledRequest;
import com.supergokou.aidataplc.dto.UserUpsertRequest;
import com.supergokou.aidataplc.service.UserManagementService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

  private final UserManagementService userManagementService;

  public UserController(UserManagementService userManagementService) {
    this.userManagementService = userManagementService;
  }

  @GetMapping
  public List<PlatformUser> users() {
    return userManagementService.users();
  }

  @PostMapping
  public PlatformUser upsertUser(@Valid @RequestBody UserUpsertRequest request) {
    return userManagementService.upsertUser(request);
  }

  @PatchMapping("/{userId}/enabled")
  public PlatformUser setUserEnabled(
      @PathVariable String userId,
      @Valid @RequestBody UserEnabledRequest request) {
    return userManagementService.setUserEnabled(userId, request.enabled());
  }

  @DeleteMapping("/{userId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteUser(@PathVariable String userId) {
    userManagementService.deleteUser(userId);
  }
}
