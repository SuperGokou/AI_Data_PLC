package com.supergokou.aidataplc;

import static org.assertj.core.api.Assertions.assertThat;

import com.supergokou.aidataplc.domain.DatasetFormat;
import com.supergokou.aidataplc.service.DatasetService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class AiDataPlcApplicationTests {

  @Autowired
  private DatasetService datasetService;

  @Test
  void exposesAllRequiredDatasetFormats() {
    assertThat(datasetService.supportedFormats())
        .containsExactly(DatasetFormat.CSV, DatasetFormat.JSON, DatasetFormat.EXCEL,
            DatasetFormat.PARQUET, DatasetFormat.REST_API, DatasetFormat.DB_VIEW);
  }
}
