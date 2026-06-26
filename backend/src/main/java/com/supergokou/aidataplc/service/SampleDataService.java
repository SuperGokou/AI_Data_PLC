package com.supergokou.aidataplc.service;

import com.supergokou.aidataplc.domain.BatchSnapshot;
import com.supergokou.aidataplc.domain.PointDefinition;
import com.supergokou.aidataplc.domain.ProcessStep;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;

@Service
public class SampleDataService {

  private static final String POINTS_RESOURCE = "/data/ai-points.xls";
  private static final String PROCESS_RESOURCE = "/data/full-process.xlsx";
  private static final Pattern CONTROL_POINT_PATTERN =
      Pattern.compile("控制点[：:]\\s*(.*?)(?:\\R|$)");
  private static final Pattern WIP_PATTERN =
      Pattern.compile("WIP\\s*状态[：:]\\s*[“\"]?(.*?)[”\"]?(?:\\R|$)", Pattern.CASE_INSENSITIVE);
  private static final Pattern SYSTEM_ACTION_PATTERN =
      Pattern.compile("系统动作[：:]\\s*(.*)", Pattern.DOTALL);

  private final DataFormatter formatter = new DataFormatter(Locale.CHINA);
  private List<PointDefinition> points = List.of();
  private List<ProcessStep> processSteps = List.of();

  @PostConstruct
  void loadSpreadsheetData() {
    points = List.copyOf(readPoints());
    processSteps = List.copyOf(readProcessSteps());
  }

  public List<PointDefinition> points() {
    return points;
  }

  public List<ProcessStep> processSteps() {
    return processSteps;
  }

  public List<BatchSnapshot> batches() {
    return List.of();
  }

  private List<PointDefinition> readPoints() {
    try (Workbook workbook = openWorkbook(POINTS_RESOURCE)) {
      Sheet sheet = workbook.getSheetAt(0);
      List<PointDefinition> results = new ArrayList<>();
      for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
        Row row = sheet.getRow(rowIndex);
        String fieldName = cell(row, 1);
        if (fieldName.isBlank()) {
          continue;
        }
        String note = joinNonBlank(cell(row, 8), cell(row, 9));
        results.add(new PointDefinition(
            parseInteger(cell(row, 0)),
            fieldName,
            cell(row, 2),
            cell(row, 3),
            cell(row, 4),
            cell(row, 5),
            cell(row, 6),
            cell(row, 7),
            note,
            true));
      }
      return results;
    } catch (IOException exception) {
      throw new IllegalStateException("Failed to read AI point spreadsheet: " + POINTS_RESOURCE,
          exception);
    }
  }

  private List<ProcessStep> readProcessSteps() {
    try (Workbook workbook = openWorkbook(PROCESS_RESOURCE)) {
      Sheet sheet = workbook.getSheetAt(0);
      List<ProcessStep> results = new ArrayList<>();
      for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
        Row row = sheet.getRow(rowIndex);
        int sequence = parseInteger(cell(row, 0));
        String workshop = cell(row, 1);
        String stepName = cell(row, 2);
        if (sequence == 0 || stepName.isBlank()) {
          continue;
        }
        String notes = cell(row, 6);
        results.add(new ProcessStep(
            sequence,
            workshop,
            stepName,
            firstNonBlank(extract(CONTROL_POINT_PATTERN, notes), cell(row, 3)),
            extract(WIP_PATTERN, notes),
            firstNonBlank(extract(SYSTEM_ACTION_PATTERN, notes), cell(row, 5), cell(row, 4)),
            cell(row, 10)));
      }
      return results;
    } catch (IOException exception) {
      throw new IllegalStateException("Failed to read process spreadsheet: " + PROCESS_RESOURCE,
          exception);
    }
  }

  private Workbook openWorkbook(String resourcePath) throws IOException {
    InputStream input = SampleDataService.class.getResourceAsStream(resourcePath);
    if (input == null) {
      throw new IllegalStateException("Missing spreadsheet resource: " + resourcePath);
    }
    return WorkbookFactory.create(input);
  }

  private String cell(Row row, int cellIndex) {
    if (row == null || row.getCell(cellIndex) == null) {
      return "";
    }
    return formatter.formatCellValue(row.getCell(cellIndex)).trim();
  }

  private static int parseInteger(String value) {
    if (value == null || value.isBlank()) {
      return 0;
    }
    String normalized = value.trim();
    int dotIndex = normalized.indexOf('.');
    if (dotIndex >= 0) {
      normalized = normalized.substring(0, dotIndex);
    }
    return Integer.parseInt(normalized);
  }

  private static String extract(Pattern pattern, String value) {
    if (value == null || value.isBlank()) {
      return "";
    }
    Matcher matcher = pattern.matcher(value);
    if (!matcher.find()) {
      return "";
    }
    return matcher.group(1).trim();
  }

  private static String firstNonBlank(String... values) {
    for (String value : values) {
      if (value != null && !value.isBlank()) {
        return value.trim();
      }
    }
    return "";
  }

  private static String joinNonBlank(String... values) {
    List<String> parts = new ArrayList<>();
    for (String value : values) {
      if (value != null && !value.isBlank()) {
        parts.add(value.trim());
      }
    }
    return String.join("；", parts);
  }
}
