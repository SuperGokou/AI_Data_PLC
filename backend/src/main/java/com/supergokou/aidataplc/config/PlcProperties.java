package com.supergokou.aidataplc.config;

import com.supergokou.aidataplc.domain.ControlMode;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "plc")
public class PlcProperties {

  private int realtimeDelaySeconds = 5;
  private ControlMode aiControlMode = ControlMode.RECOMMEND_ONLY;
  private Map<String, ProviderProperties> providers = new LinkedHashMap<>();

  public int getRealtimeDelaySeconds() {
    return realtimeDelaySeconds;
  }

  public void setRealtimeDelaySeconds(int realtimeDelaySeconds) {
    this.realtimeDelaySeconds = realtimeDelaySeconds;
  }

  public ControlMode getAiControlMode() {
    return aiControlMode;
  }

  public void setAiControlMode(ControlMode aiControlMode) {
    this.aiControlMode = aiControlMode;
  }

  public Map<String, ProviderProperties> getProviders() {
    return providers;
  }

  public void setProviders(Map<String, ProviderProperties> providers) {
    this.providers = providers;
  }

  public static class ProviderProperties {
    private String displayName;
    private String baseUrl;
    private String apiKey;
    private String modelName;
    private boolean industrialAlgorithmCapable;

    public String getDisplayName() {
      return displayName;
    }

    public void setDisplayName(String displayName) {
      this.displayName = displayName;
    }

    public String getBaseUrl() {
      return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
      this.baseUrl = baseUrl;
    }

    public String getApiKey() {
      return apiKey;
    }

    public void setApiKey(String apiKey) {
      this.apiKey = apiKey;
    }

    public String getModelName() {
      return modelName;
    }

    public void setModelName(String modelName) {
      this.modelName = modelName;
    }

    public boolean isIndustrialAlgorithmCapable() {
      return industrialAlgorithmCapable;
    }

    public void setIndustrialAlgorithmCapable(boolean industrialAlgorithmCapable) {
      this.industrialAlgorithmCapable = industrialAlgorithmCapable;
    }
  }
}
