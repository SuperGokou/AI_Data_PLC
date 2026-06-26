# Deployment

## Local Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

## Secrets

Never commit `.env`. Store production secrets in the deployment platform:

- `DEEPSEEK_API_KEY`
- `QWEN_API_KEY`
- `GLM_API_KEY`
- `MINIMAX_API_KEY`
- `OPENAI_COMPATIBLE_API_KEY`
- database passwords
- `INFLUXDB_TOKEN`
- `RENDER_API_KEY`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `AI_CONTROL_HMAC_SECRET`

## Render Direction

The repository is prepared for container deployment. For Render, use:

- one backend web service from `backend/Dockerfile`
- one static frontend service from `frontend/Dockerfile` or built `frontend/dist`
- managed MySQL-compatible database or external MySQL
- external InfluxDB and Redis, unless they are hosted separately

Render does not run the full `docker-compose.yml` as a production stack. Compose remains the local and staging smoke-test path.

The frontend `VITE_API_BASE_URL` must be the backend public URL, not a Render private service host. The backend `CORS_ALLOWED_ORIGINS` must include the frontend public URL.

## Production Gate

- Health endpoint returns healthy.
- Dataset export job works for at least CSV and JSON.
- Provider configuration never returns raw API keys.
- AI control mode defaults to `RECOMMEND_ONLY`.
- PLC direct dispatch remains disabled until safety testing is signed off.
