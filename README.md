# AI Data PLC

Industrial data middleware for textile dyeing production data. The platform sits between PLC/device collection and AI model training/inference:

```text
PLC / ERP / spectrum / energy data -> AI Data PLC -> standardized datasets -> AI training, simulation, and control recommendations
```

## Current Scope

- Java/Spring Boot backend skeleton with operational APIs.
- React/Vite management console for production and data operations.
- MySQL, InfluxDB, and Redis deployment wiring through Docker Compose.
- Configurable model providers: DeepSeek, Qwen, GLM, MiniMax, and OpenAI-compatible APIs.
- Configurable AI control policy: off, recommend only, simulation, approval required, or auto dispatch.
- Dataset export workflow covering CSV, JSON, Excel, Parquet, REST API, and database view formats.
- Sample field and process-step mappings based on the PLC project spreadsheets.

## Quick Start

Copy `.env.example` to `.env`, fill secrets, then run:

```bash
docker compose up --build
```

Services:

- Backend API: `http://localhost:8080`
- Frontend console: `http://localhost:5173`
- MySQL: `localhost:3306`
- InfluxDB: `http://localhost:8086`
- Redis: `localhost:6379`

## Local Development

The backend is built inside Docker so local Java/Maven versions do not block development.

Frontend only:

```bash
cd frontend
npm install
npm run dev
```

Backend only through Docker:

```bash
docker compose up --build backend
```

## Documentation

- [Architecture](docs/architecture.md)
- [Data Mapping](docs/data-mapping.md)
- [Multi-Agent Plan](docs/multi-agent-plan.md)
- [Deployment](docs/deployment.md)
