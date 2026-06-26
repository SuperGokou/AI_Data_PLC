# Data Mapping

The initial schema is based on:

- `AI数据采集测点清单.xls`
- `全流程工艺文档.xlsx`

## Primary Key

`batch_id` is the cross-table production batch key. A single dyeing vessel run maps to one data batch.

## Core Entities

| Entity | Purpose |
| --- | --- |
| `production_batch` | Work order, fabric, machine, route, current status |
| `process_step` | Standard process steps such as open card, dyeing, washing, setting |
| `batch_wip_event` | Batch movement through WIP states |
| `point_definition` | Field catalog from the collection point list |
| `timeseries_point` | InfluxDB measurement for high-frequency PLC/device values |
| `spectrum_result` | K/S, reflectance, Delta E 2000, Lab, spectrum JSON |
| `dataset_export_job` | Dataset export lifecycle and output format |
| `ai_decision_log` | Model recommendation, approval status, control policy, dispatch result |

Initial MySQL DDL lives in `deploy/mysql/init/001_initial_schema.sql` for local Compose startup. Production migrations should move to Flyway or Liquibase before the first production release.

## Required AI Dataset Fields

Key fields for the first data mart:

- `batch_id`
- `fabric_weight_gsm`
- `width_cm`
- `fiber_type`
- `liquor_ratio`
- `machine_id`
- `time_min`
- `temperature_c`
- `ph`
- `conductivity_ms_cm`
- `dye_concentration_spectrum`
- `dye_uptake_pct`
- `ks_value`
- `delta_e_2000`
- `spectrum_curve_json`
- `rft_flag`
- `result_L`
- `result_a`
- `result_b`

## Dataset Formats

The platform exposes the same dataset job contract for:

- CSV
- JSON
- Excel
- Parquet
- REST API
- Database view

CSV and JSON can be streamed first. Excel and Parquet should be implemented as async export jobs because production batches can become large.
