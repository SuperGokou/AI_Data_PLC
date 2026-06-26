package com.supergokou.aidataplc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.supergokou.aidataplc.domain.DatasetFormat;
import com.supergokou.aidataplc.domain.ModelProviderSetting;
import com.supergokou.aidataplc.domain.PlatformUser;
import com.supergokou.aidataplc.domain.PlatformUserRole;
import com.supergokou.aidataplc.dto.ModelProviderUpsertRequest;
import com.supergokou.aidataplc.dto.UserUpsertRequest;
import com.supergokou.aidataplc.service.DatasetService;
import com.supergokou.aidataplc.service.ModelProviderService;
import com.supergokou.aidataplc.service.SampleDataService;
import com.supergokou.aidataplc.service.UserManagementService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class AiDataPlcApplicationTests {

  @Autowired
  private DatasetService datasetService;

  @Autowired
  private ModelProviderService modelProviderService;

  @Autowired
  private SampleDataService sampleDataService;

  @Autowired
  private UserManagementService userManagementService;

  @Test
  void exposesAllRequiredDatasetFormats() {
    assertThat(datasetService.supportedFormats())
        .containsExactly(DatasetFormat.CSV, DatasetFormat.JSON, DatasetFormat.EXCEL,
            DatasetFormat.PARQUET, DatasetFormat.REST_API, DatasetFormat.DB_VIEW);
  }

  @Test
  void loadsOnlySpreadsheetBackedOperationalData() {
    assertThat(sampleDataService.points()).hasSize(40);
    assertThat(sampleDataService.processSteps()).hasSize(35);
    assertThat(sampleDataService.batches()).isEmpty();
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

    modelProviderService.deleteProvider("customer-gateway");
    assertThat(modelProviderService.providers())
        .noneMatch(item -> item.providerId().equals("customer-gateway"));
  }

  @Test
  void managesRuntimeUsersAndProtectsBootstrapAdmin() {
    PlatformUser user = userManagementService.upsertUser(
        new UserUpsertRequest(
            "data-admin",
            "Data Admin",
            "data.admin",
            "data.admin@ark-mfg.local",
            PlatformUserRole.ADMIN,
            "Data Platform",
            true));

    assertThat(user.userId()).isEqualTo("data-admin");
    assertThat(user.role()).isEqualTo(PlatformUserRole.ADMIN);
    assertThat(user.enabled()).isTrue();
    assertThat(user.source()).isEqualTo("USER_ADDED");

    PlatformUser disabled = userManagementService.setUserEnabled("data-admin", false);
    assertThat(disabled.enabled()).isFalse();

    userManagementService.deleteUser("data-admin");
    assertThat(userManagementService.users())
        .noneMatch(item -> item.userId().equals("data-admin"));

    assertThatThrownBy(() -> userManagementService.deleteUser("admin"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("System bootstrap users");
  }
}
