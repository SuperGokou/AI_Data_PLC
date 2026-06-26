# Multi-Agent Plan

## Agents

| Agent | Scope | Write Boundary |
| --- | --- | --- |
| `repo-explorer` | Inspect repository, toolchain, startup commands, risks | read-only |
| `domain-data-agent` | Data model, migrations, sample import, WIP mapping | `backend/src/main`, `docs/data-mapping.md` |
| `ingestion-agent` | MQTT/Kafka, ERP import, device simulator, protocol fallback | backend ingestion packages |
| `governance-agent` | Deduplication, anomaly filtering, missing-field rules, batch/time/process alignment | backend governance packages |
| `dataset-api-agent` | Export jobs, REST API, DB view, Excel/Parquet adapters | backend dataset packages |
| `frontend-agent` | Management console UI | `frontend/` |
| `qa-devops-agent` | Docker, tests, CI, deployment docs | `docker-compose.yml`, `docs/deployment.md`, `.github/` |
| `security-agent` | AI control gate, approval, audit log, secrets handling | backend security/control packages |

## Execution Order

1. Initialize repository and runnable skeleton.
2. Lock API and data contracts.
3. Build simulated device-to-dataset line.
4. Add real MQTT/Kafka adapters.
5. Add optional PLC direct adapter after customer confirms protocol.
6. Build UI operations workflow.
7. Add deployment, tests, and production readiness checks.

## First Thread

The first implementation line is:

```text
sample PLC/ERP/spectrum data -> normalized records -> MySQL/InfluxDB contract -> dataset export API -> console
```
