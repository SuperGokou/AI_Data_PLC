package com.supergokou.aidataplc.controller;

import com.supergokou.aidataplc.domain.ControlPolicy;
import com.supergokou.aidataplc.domain.ModelProviderSetting;
import com.supergokou.aidataplc.service.ModelProviderService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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

  @GetMapping("/control-policy")
  public ControlPolicy controlPolicy() {
    return modelProviderService.controlPolicy();
  }
}
