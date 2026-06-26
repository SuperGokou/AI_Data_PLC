package com.supergokou.aidataplc.controller;

import com.supergokou.aidataplc.domain.ControlPolicy;
import com.supergokou.aidataplc.domain.ModelProviderSetting;
import com.supergokou.aidataplc.dto.ModelProviderEnabledRequest;
import com.supergokou.aidataplc.dto.ModelProviderUpsertRequest;
import com.supergokou.aidataplc.service.ModelProviderService;
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
@RequestMapping("/api/v1/models")
public class ModelController {

  private final ModelProviderService modelProviderService;

  public ModelController(ModelProviderService modelProviderService) {
    this.modelProviderService = modelProviderService;
  }

  @GetMapping("/providers")
  public List<ModelProviderSetting> providers() {
    return modelProviderService.providers();
  }

  @PostMapping("/providers")
  public ModelProviderSetting upsertProvider(@Valid @RequestBody ModelProviderUpsertRequest request) {
    return modelProviderService.upsertProvider(request);
  }

  @PatchMapping("/providers/{providerId}/enabled")
  public ModelProviderSetting setProviderEnabled(
      @PathVariable String providerId,
      @Valid @RequestBody ModelProviderEnabledRequest request) {
    return modelProviderService.setProviderEnabled(providerId, request.enabled());
  }

  @DeleteMapping("/providers/{providerId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteProvider(@PathVariable String providerId) {
    modelProviderService.deleteProvider(providerId);
  }

  @GetMapping("/control-policy")
  public ControlPolicy controlPolicy() {
    return modelProviderService.controlPolicy();
  }
}
