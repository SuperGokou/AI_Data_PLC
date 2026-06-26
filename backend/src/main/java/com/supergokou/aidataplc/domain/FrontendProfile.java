package com.supergokou.aidataplc.domain;

import java.util.List;

public record FrontendProfile(
    String theme,
    String homeView,
    List<String> modules,
    String dashboardTitle,
    String focusLabel
) {
  public FrontendProfile {
    modules = List.copyOf(modules);
  }
}
