# Observability

## Metrics

The API uses `prometheus-fastapi-instrumentator` and exposes `/metrics`. The metrics route itself is excluded from instrumentation.

Prometheus scrapes every 15 seconds:

| Job | Target | Purpose |
| --- | --- | --- |
| `sentinel-backend` | `backend:8000/metrics` | Requests, status, and latency |
| `cadvisor` | `cadvisor:8080` | Containers |
| `node-exporter` | `node-exporter:9100` | Host |

## Logs

The backend configures logging at startup and records operational events, including:

- API startup and shutdown;
- worker startup and shutdown;
- health-check results;
- alert delivery failures.

Promtail discovers containers through the Docker socket, extracts their logs, and adds labels such as container, service, and Compose project. Records are sent to Loki.

## Visualization

Grafana uses provisioned data sources to query metrics and logs. Volumes preserve Grafana, Prometheus, and Loki data across restarts.

## Health Checks

- `GET /health`: confirms that the API process is responding;
- Docker health checks control startup order;
- PostgreSQL uses `pg_isready`;
- the backend and frontend define their own Compose checks.

The `/health` endpoint does not test the PostgreSQL connection; it indicates API availability only.

## Limitations

- Distributed tracing is not implemented.
- Alertmanager is not part of the current stack.
- SLOs and recording rules are not declared.
- Retention and sizing use local configuration.
- Promtail is sufficient for the MVP but may be replaced with Grafana Alloy in a future iteration.
