package com.supergokou.aidataplc.service;

import com.supergokou.aidataplc.config.PlcProperties;
import com.supergokou.aidataplc.domain.ControlPolicy;
import com.supergokou.aidataplc.domain.ModelProviderSetting;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ModelProviderService {

  private final PlcProperties properties;

  public ModelProviderService(PlcProperties properties) {
    this.properties = properties;
  }

  public List<ModelProviderSetting> providers() {
    return properties.getProviders().entrySet().stream()
        .map(entry -> {
          PlcProperties.ProviderProperties provider = entry.getValue();
          boolean configured = StringUtils.hasText(provider.getApiKey())
              && StringUtils.hasText(provider.getBaseUrl())
              && StringUtils.hasText(provider.getModelName());
          return new ModelProviderSetting(
              entry.getKey(),
              provider.getDisplayName(),
              provider.getBaseUrl(),
              provider.getModelName(),
              configured,
              configured,
              provider.isIndustrialAlgorithmCapable());
        })
        .toList();
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
}
