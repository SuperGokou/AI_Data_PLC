package com.supergokou.aidataplc;

import static org.assertj.core.api.Assertions.assertThat;

import com.supergokou.aidataplc.domain.DatasetFormat;
import com.supergokou.aidataplc.domain.ModelProviderSetting;
import com.supergokou.aidataplc.dto.ModelProviderUpsertRequest;
import com.supergokou.aidataplc.service.DatasetService;
import com.supergokou.aidataplc.service.ModelProviderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class AiDataPlcApplicationTests {

  @Autowired
  private DatasetService datasetService;

  @Autowired
  private ModelProviderService modelProviderService;

  @Test
  void exposesAllRequiredDatasetFormats() {
    assertThat(datasetService.supportedFormats())
        .containsExactly(DatasetFormat.CSV, DatasetFormat.JSON, DatasetFormat.EXCEL,
            DatasetFormat.PARQUET, DatasetFormat.REST_API, DatasetFormat.DB_VIEW);
  }

  @Test
  void allowsUserAddedProviderWithoutExposingApiKey() {
    ModelProviderSetting provider = modelProviderService.upsertProvider(
        new ModelProviderUpsertRequest(
            "customer-gateway",
            "Customer Gateway",
            "https://models.example.com/v1",
            "industrial-dyeing-v1",
            "sk-test-secret-value",
            true,
            true));

    assertThat(provider.configured()).isTrue();
    assertThat(provider.enabled()).isTrue();
    assertThat(provider.source()).isEqualTo("USER_ADDED");
    assertThat(provider.apiKeyFingerprint()).startsWith("sha256:");
    assertThat(provider.toString()).doesNotContain("sk-test-secret-value");

    ModelProviderSetting disabled = modelProviderService.setProviderEnabled("customer-gateway", false);
    assertThat(disabled.enabled()).isFalse();
  }
}
