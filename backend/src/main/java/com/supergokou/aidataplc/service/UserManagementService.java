package com.supergokou.aidataplc.service;

import com.supergokou.aidataplc.domain.PlatformUser;
import com.supergokou.aidataplc.domain.PlatformUserRole;
import com.supergokou.aidataplc.dto.UserUpsertRequest;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class UserManagementService {

  private static final String SOURCE_SYSTEM = "SYSTEM";
  private static final String SOURCE_USER_ADDED = "USER_ADDED";

  private final Map<String, RuntimeUser> users = new ConcurrentHashMap<>();

  public UserManagementService() {
    Instant bootstrapTime = Instant.parse("2026-01-01T00:00:00Z");
    users.put("admin", new RuntimeUser(
        "admin",
        "系统管理员",
        "admin",
        "admin@ark-mfg.local",
        PlatformUserRole.ADMIN,
        true,
        "平台管理",
        bootstrapTime,
        null,
        SOURCE_SYSTEM));
    users.put("ops-lead", new RuntimeUser(
        "ops-lead",
        "生产运营负责人",
        "ops.lead",
        "ops.lead@ark-mfg.local",
        PlatformUserRole.OPERATOR,
        true,
        "生产运营",
        bootstrapTime,
        null,
        SOURCE_SYSTEM));
  }

  public List<PlatformUser> users() {
    return users.values().stream()
        .sorted(Comparator.comparing(RuntimeUser::source).thenComparing(RuntimeUser::userId))
        .map(RuntimeUser::toUser)
        .toList();
  }

  public PlatformUser upsertUser(UserUpsertRequest request) {
    String userId = normalizeId(request.userId());
    String username = normalizeUsername(request.username());
    String email = normalizeEmail(request.email());
    assertUniqueIdentity(userId, username, email);

    RuntimeUser previous = users.get(userId);
    RuntimeUser next = new RuntimeUser(
        userId,
        request.displayName().trim(),
        username,
        email,
        request.role(),
        request.enabled() == null || request.enabled(),
        request.department().trim(),
        previous == null ? Instant.now() : previous.createdAt(),
        previous == null ? null : previous.lastLoginAt(),
        previous == null ? SOURCE_USER_ADDED : previous.source());

    putAndValidate(userId, previous, next);
    return next.toUser();
  }

  public PlatformUser setUserEnabled(String userId, boolean enabled) {
    String normalizedUserId = normalizeId(userId);
    RuntimeUser previous = users.get(normalizedUserId);
    if (previous == null) {
      throw new IllegalArgumentException("User not found");
    }
    RuntimeUser next = previous.withEnabled(enabled);
    putAndValidate(normalizedUserId, previous, next);
    return next.toUser();
  }

  public void deleteUser(String userId) {
    String normalizedUserId = normalizeId(userId);
    RuntimeUser previous = users.get(normalizedUserId);
    if (previous == null) {
      throw new IllegalArgumentException("User not found");
    }
    if (SOURCE_SYSTEM.equals(previous.source())) {
      throw new IllegalArgumentException("System bootstrap users cannot be deleted");
    }

    users.remove(normalizedUserId);
    try {
      ensureEnabledAdminExists();
    } catch (IllegalArgumentException exception) {
      users.put(normalizedUserId, previous);
      throw exception;
    }
  }

  private void putAndValidate(String userId, RuntimeUser previous, RuntimeUser next) {
    users.put(userId, next);
    try {
      ensureEnabledAdminExists();
    } catch (IllegalArgumentException exception) {
      if (previous == null) {
        users.remove(userId);
      } else {
        users.put(userId, previous);
      }
      throw exception;
    }
  }

  private void assertUniqueIdentity(String userId, String username, String email) {
    boolean duplicateUsername = users.values().stream()
        .anyMatch(user -> !user.userId().equals(userId) && user.username().equals(username));
    if (duplicateUsername) {
      throw new IllegalArgumentException("Username already exists");
    }

    boolean duplicateEmail = users.values().stream()
        .anyMatch(user -> !user.userId().equals(userId) && user.email().equals(email));
    if (duplicateEmail) {
      throw new IllegalArgumentException("Email already exists");
    }
  }

  private void ensureEnabledAdminExists() {
    boolean hasAdmin = users.values().stream()
        .anyMatch(user -> user.enabled() && user.role() == PlatformUserRole.ADMIN);
    if (!hasAdmin) {
      throw new IllegalArgumentException("At least one enabled admin user is required");
    }
  }

  private static String normalizeId(String value) {
    return value.trim().toLowerCase(Locale.ROOT);
  }

  private static String normalizeUsername(String value) {
    return value.trim().toLowerCase(Locale.ROOT);
  }

  private static String normalizeEmail(String value) {
    return value.trim().toLowerCase(Locale.ROOT);
  }

  private record RuntimeUser(
      String userId,
      String displayName,
      String username,
      String email,
      PlatformUserRole role,
      boolean enabled,
      String department,
      Instant createdAt,
      Instant lastLoginAt,
      String source
  ) {
    PlatformUser toUser() {
      return new PlatformUser(
          userId,
          displayName,
          username,
          email,
          role,
          enabled,
          department,
          createdAt,
          lastLoginAt,
          source);
    }

    RuntimeUser withEnabled(boolean nextEnabled) {
      return new RuntimeUser(
          userId,
          displayName,
          username,
          email,
          role,
          nextEnabled,
          department,
          createdAt,
          lastLoginAt,
          source);
    }
  }
}
