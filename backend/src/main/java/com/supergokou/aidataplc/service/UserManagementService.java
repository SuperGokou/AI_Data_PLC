package com.supergokou.aidataplc.service;

import com.supergokou.aidataplc.domain.FrontendProfile;
import com.supergokou.aidataplc.domain.PlatformUser;
import com.supergokou.aidataplc.domain.PlatformUserRole;
import com.supergokou.aidataplc.dto.UserUpsertRequest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class UserManagementService {

  private static final String SOURCE_SYSTEM = "SYSTEM";
  private static final String SOURCE_USER_ADDED = "USER_ADDED";
  private static final List<String> ALLOWED_MODULES =
      List.of("overview", "collection", "process", "points", "data");
  private static final Set<String> ALLOWED_THEMES = Set.of("aurora", "graphite");

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
        SOURCE_SYSTEM,
        defaultProfile(PlatformUserRole.ADMIN)));
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
        SOURCE_SYSTEM,
        defaultProfile(PlatformUserRole.OPERATOR)));
  }

  public List<PlatformUser> users() {
    return users.values().stream()
        .sorted(Comparator.comparing(RuntimeUser::source).thenComparing(RuntimeUser::userId))
        .map(RuntimeUser::toUser)
        .toList();
  }

  public PlatformUser loginFrontend(String identifier) {
    String normalizedIdentifier = normalizeIdentifier(identifier);
    RuntimeUser user = users.values().stream()
        .filter(item -> item.userId().equals(normalizedIdentifier)
            || item.username().equals(normalizedIdentifier)
            || item.email().equals(normalizedIdentifier))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Account not found"));
    if (!user.enabled()) {
      throw new IllegalArgumentException("Account is disabled");
    }

    RuntimeUser next = user.withLastLoginAt(Instant.now());
    users.put(next.userId(), next);
    return next.toUser();
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
        previous == null ? SOURCE_USER_ADDED : previous.source(),
        resolveProfile(request, request.role(), previous));

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

  private FrontendProfile resolveProfile(
      UserUpsertRequest request,
      PlatformUserRole role,
      RuntimeUser previous) {
    FrontendProfile roleDefault = defaultProfile(role);
    FrontendProfile base = previous == null ? roleDefault : previous.frontendProfile();
    String theme = sanitizeTheme(request.frontendTheme(), base.theme());
    String homeView = sanitizeView(request.frontendHomeView(), base.homeView());
    List<String> modules = sanitizeModules(request.frontendModules(), base.modules());
    if (!modules.contains(homeView)) {
      ArrayList<String> expanded = new ArrayList<>();
      expanded.add(homeView);
      expanded.addAll(modules);
      modules = sanitizeModules(expanded, roleDefault.modules());
    }
    return new FrontendProfile(
        theme,
        homeView,
        modules,
        roleDefault.dashboardTitle(),
        roleDefault.focusLabel());
  }

  private static FrontendProfile defaultProfile(PlatformUserRole role) {
    return switch (role) {
      case ADMIN -> new FrontendProfile(
          "aurora",
          "overview",
          ALLOWED_MODULES,
          "管理视角展示端",
          "系统状态、模型配置与数据接入");
      case OPERATOR -> new FrontendProfile(
          "aurora",
          "process",
          List.of("overview", "collection", "process"),
          "生产运营展示端",
          "工艺进度、WIP 与采集链路");
      case DATA_ENGINEER -> new FrontendProfile(
          "graphite",
          "points",
          List.of("overview", "collection", "points", "data"),
          "数据工程展示端",
          "测点质量、数据结构与导出边界");
      case AUDITOR -> new FrontendProfile(
          "graphite",
          "data",
          List.of("overview", "points", "data"),
          "审计只读展示端",
          "真实来源、接口边界与数据追溯");
    };
  }

  private static String sanitizeTheme(String requested, String fallback) {
    String normalized = normalizeOptional(requested);
    return ALLOWED_THEMES.contains(normalized) ? normalized : fallback;
  }

  private static String sanitizeView(String requested, String fallback) {
    String normalized = normalizeOptional(requested);
    return ALLOWED_MODULES.contains(normalized) ? normalized : fallback;
  }

  private static List<String> sanitizeModules(List<String> requested, List<String> fallback) {
    List<String> source = requested == null || requested.isEmpty() ? fallback : requested;
    LinkedHashSet<String> selected = new LinkedHashSet<>();
    for (String module : source) {
      String normalized = sanitizeView(module, null);
      if (normalized != null) {
        selected.add(normalized);
      }
    }
    if (selected.isEmpty()) {
      selected.addAll(fallback);
    }
    return ALLOWED_MODULES.stream()
        .filter(selected::contains)
        .toList();
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

  private static String normalizeIdentifier(String value) {
    return value.trim().toLowerCase(Locale.ROOT);
  }

  private static String normalizeOptional(String value) {
    return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
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
      String source,
      FrontendProfile frontendProfile
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
          source,
          frontendProfile);
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
          source,
          frontendProfile);
    }

    RuntimeUser withLastLoginAt(Instant nextLastLoginAt) {
      return new RuntimeUser(
          userId,
          displayName,
          username,
          email,
          role,
          enabled,
          department,
          createdAt,
          nextLastLoginAt,
          source,
          frontendProfile);
    }
  }
}
