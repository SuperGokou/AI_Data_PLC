CREATE TABLE IF NOT EXISTS production_batch (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  batch_id VARCHAR(64) NOT NULL UNIQUE,
  product_code VARCHAR(128),
  fabric_type VARCHAR(128),
  machine_id VARCHAR(128),
  route_code VARCHAR(128),
  status VARCHAR(64) NOT NULL DEFAULT 'CREATED',
  planned_start_time TIMESTAMP NULL,
  actual_start_time TIMESTAMP NULL,
  actual_end_time TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_batch_status (status),
  INDEX idx_batch_machine (machine_id)
);

CREATE TABLE IF NOT EXISTS process_step (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  route_code VARCHAR(128) NOT NULL DEFAULT 'DEFAULT_DYEING',
  sequence_no INT NOT NULL,
  workshop VARCHAR(128) NOT NULL,
  step_code VARCHAR(128) NOT NULL,
  step_name VARCHAR(128) NOT NULL,
  control_point TEXT,
  standard_wip_status VARCHAR(128),
  equipment VARCHAR(128),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uk_route_step (route_code, step_code),
  INDEX idx_step_sequence (route_code, sequence_no)
);

CREATE TABLE IF NOT EXISTS batch_wip_event (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  batch_id VARCHAR(64) NOT NULL,
  step_code VARCHAR(128) NOT NULL,
  machine_id VARCHAR(128),
  operator_name VARCHAR(128),
  wip_status VARCHAR(128) NOT NULL,
  entered_at TIMESTAMP NULL,
  exited_at TIMESTAMP NULL,
  event_payload JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wip_batch (batch_id),
  INDEX idx_wip_step (step_code),
  CONSTRAINT fk_wip_batch FOREIGN KEY (batch_id) REFERENCES production_batch(batch_id)
);

CREATE TABLE IF NOT EXISTS point_definition (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no INT,
  field_name VARCHAR(128) NOT NULL UNIQUE,
  display_name VARCHAR(128) NOT NULL,
  data_type VARCHAR(64) NOT NULL,
  unit_or_format VARCHAR(64),
  sample_value TEXT,
  source_system VARCHAR(128),
  process_step VARCHAR(128),
  required_for_ai_dataset BOOLEAN NOT NULL DEFAULT TRUE,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_point_source (source_system),
  INDEX idx_point_process_step (process_step)
);

CREATE TABLE IF NOT EXISTS spectrum_result (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  batch_id VARCHAR(64) NOT NULL,
  machine_id VARCHAR(128),
  ks_value DECIMAL(12, 4),
  reflectance_pct DECIMAL(12, 4),
  delta_e_2000 DECIMAL(12, 4),
  result_l DECIMAL(12, 4),
  result_a DECIMAL(12, 4),
  result_b DECIMAL(12, 4),
  spectrum_curve_json JSON,
  measured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_spectrum_batch FOREIGN KEY (batch_id) REFERENCES production_batch(batch_id),
  INDEX idx_spectrum_batch_time (batch_id, measured_at)
);

CREATE TABLE IF NOT EXISTS dataset_export_job (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  job_id VARCHAR(64) NOT NULL UNIQUE,
  format VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  batch_ids JSON NOT NULL,
  include_spectrum BOOLEAN NOT NULL DEFAULT TRUE,
  include_wip_events BOOLEAN NOT NULL DEFAULT TRUE,
  include_ai_labels BOOLEAN NOT NULL DEFAULT TRUE,
  download_path VARCHAR(512),
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,
  INDEX idx_export_status (status)
);

CREATE TABLE IF NOT EXISTS model_provider_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  provider_id VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(128) NOT NULL,
  base_url VARCHAR(512),
  model_name VARCHAR(256),
  api_key_secret_ref VARCHAR(256),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  industrial_algorithm_capable BOOLEAN NOT NULL DEFAULT FALSE,
  timeout_millis INT NOT NULL DEFAULT 30000,
  max_retries INT NOT NULL DEFAULT 2,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_decision_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  decision_id VARCHAR(64) NOT NULL UNIQUE,
  batch_id VARCHAR(64),
  provider_id VARCHAR(64),
  model_name VARCHAR(256),
  control_mode VARCHAR(64) NOT NULL,
  recommendation JSON,
  approval_status VARCHAR(64) NOT NULL DEFAULT 'NOT_REQUIRED',
  dispatch_status VARCHAR(64) NOT NULL DEFAULT 'NOT_DISPATCHED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_decision_batch (batch_id),
  INDEX idx_ai_decision_provider (provider_id)
);
