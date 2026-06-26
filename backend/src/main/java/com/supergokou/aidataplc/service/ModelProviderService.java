package com.supergokou.aidataplc.service;

import com.supergokou.aidataplc.config.PlcProperties;
import com.supergokou.aidataplc.domain.ControlPolicy;
import com.supergokou.aidataplc.domain.ModelProviderSetting;
import com.supergokou.aidataplc.dto.ModelProviderUpsertRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ModelProviderService {

  private static final String SOURCE_ENVIRONMENT = "ENVIRONMENT";
  private static final String SOURCE_BACKEND_OVERRIDE = "BACKEND_OVERRIDE";
  private static final String SOURCE_USER_ADDED = "USER_ADDED";

  private final PlcProperties properties;
  private final Map<String, RuntimeModelProvider> runtimeProviders = new ConcurrentHashMap<>();

  public ModelProviderService(PlcProperties properties) {
    this.properties = properties;
  }

  public List<ModelProviderSetting> providers() {
    List<ModelProviderSetting> results = new ArrayList<>();
    properties.getProviders().forEach((providerId, provider) -> {
      RuntimeModelProvider runtimeProvider = runtimeProviders.get(providerId.toLowerCase(Locale.ROOT));
      if (runtimeProvider != null) {
        results.add(runtimeProvider.toSetting());
        return;
      }
      boolean configured = StringUtils.hasText(provider.getApiKey())
          && StringUtils.hasText(provider.getBaseUrl())
          && StringUtils.hasText(provider.getModelName());
      results.add(new ModelProviderSetting(
          providerId,
          provider.getDisplayName(),
          provider.getBaseUrl(),
          provider.getModelName(),
          configured,
          configured,
          provider.isIndustrialAlgorithmCapable(),
          SOURCE_ENVIRONMENT,
          fingerprint(provider.getApiKey())));
    });
    runtimeProviders.values().stream()
        .filter(provider -> !properties.getProviders().containsKey(provider.providerId()))
        .map(RuntimeModelProvider::toSetting)
        .sorted((left, right) -> left.providerId().compareTo(right.providerId()))
        .forEach(results::add);
    return results;
  }

  public ModelProviderSetting upsertProvider(ModelProviderUpsertRequest request) {
    String providerId = request.providerId().toLowerCase(Locale.ROOT);
    boolean builtInProvider = properties.getProviders().containsKey(providerId);
    RuntimeModelProvider provider = new RuntimeModelProvider(
        providerId,
        request.displayName().trim(),
        request.baseUrl().trim(),
        request.modelName().trim(),
        request.apiKey(),
        request.industrialAlgorithmCapable(),
        request.enabled() == null || request.enabled(),
        builtInProvider ? SOURCE_BACKEND_OVERRIDE : SOURCE_USER_ADDED);
    runtimeProviders.put(providerId, provider);
    return provider.toSetting();
  }

  public ModelProviderSetting setProviderEnabled(String providerId, boolean enabled) {
    String normalizedProviderId = providerId.toLowerCase(Locale.ROOT);
    RuntimeModelProvider provider = runtimeProviders.get(normalizedProviderId);
    if (provider == null && properties.getProviders().containsKey(normalizedProviderId)) {
      provider = fromBuiltInProvider(normalizedProviderId, properties.getProviders().get(normalizedProviderId));
    }
    if (provider == null) {
      throw new IllegalArgumentException("Provider not found");
    }
    RuntimeModelProvider updated = provider.withEnabled(enabled);
    runtimeProviders.put(updated.providerId(), updated);
    return updated.toSetting();
  }

  public void deleteProvider(String providerId) {
    String normalizedProviderId = providerId.toLowerCase(Locale.ROOT);
    RuntimeModelProvider provider = runtimeProviders.get(normalizedProviderId);
    if (provider == null || !SOURCE_USER_ADDED.equals(provider.source())) {
      throw new IllegalArgumentException("Only user-added providers can be deleted here");
    }
    runtimeProviders.remove(normalizedProviderId);
  }

  public ControlPolicy controlPolicy() {
    boolean approval = switch (properties.getAiControlMode()) {
      case APPROVAL_REQUIRED, AUTO_DISPATCH -> true;
      default -> false;
    };
    return new ControlPolicy(
        properties.getAiControlMode(),
        properties.getRealtimeDelaySeconds(),
        approval,
        true,
        "AI反控默认只给建议；进入自动下发前必须完成客户设备协议、安全联锁、审批与回滚验证。");
  }

  private static String fingerprint(String apiKey) {
    if (!StringUtils.hasText(apiKey)) {
      return "";
    }
    try {
      byte[] digest = MessageDigest.getInstance("SHA-256")
          .digest(apiKey.getBytes(StandardCharsets.UTF_8));
      return "sha256:" + HexFormat.of().formatHex(digest, 0, 4);
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 is not available", exception);
    }
  }

  private static RuntimeModelProvider fromBuiltInProvider(
      String providerId,
      PlcProperties.ProviderProperties provider) {
    boolean configured = StringUtils.hasText(provider.getApiKey())
        && StringUtils.hasText(provider.getBaseUrl())
        && StringUtils.hasText(provider.getModelName());
    return new RuntimeModelProvider(
        providerId,
        provider.getDisplayName(),
        provider.getBaseUrl(),
        provider.getModelName(),
        provider.getApiKey(),
        provider.isIndustrialAlgorithmCapable(),
        configured,
        SOURCE_BACKEND_OVERRIDE);
  }

  private record RuntimeModelProvider(
      String providerId,
      String displayName,
      String baseUrl,
      String modelName,
      String apiKey,
      boolean industrialAlgorithmCapable,
      boolean enabled,
      String source
  ) {
    ModelProviderSetting toSetting() {
      boolean configured = StringUtils.hasText(apiKey)
          && StringUtils.hasText(baseUrl)
          && StringUtils.hasText(modelName);
      return new ModelProviderSetting(
          providerId,
          displayName,
          baseUrl,
          modelName,
          configured,
          enabled,
          industrialAlgorithmCapable,
          source,
          fingerprint(apiKey));
    }

    RuntimeModelProvider withEnabled(boolean nextEnabled) {
      return new RuntimeModelProvider(
          providerId,
          displayName,
          baseUrl,
          modelName,
          apiKey,
          industrialAlgorithmCapable,
          nextEnabled,
          source);
    }
  }
}
