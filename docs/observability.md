# Observability

Sentinel combines application metrics, persisted domain state, Docker and host telemetry, and centralized logs. The stack is provisioned by `docker-compose.yml`; no manual Grafana datasource or dashboard setup is required.

## Metric sources

Prometheus scrapes every 15 seconds:

| Job | Internal target | Category | Purpose |
| --- | --- | --- | --- |
| `sentinel-backend` | `backend:8000/metrics` | Application | API HTTP behavior and Sentinel domain monitoring |
| `cadvisor` | `cadvisor:8080` | Containers | CPU, memory, filesystem, network, and lifecycle telemetry for real Docker containers |
| `node-exporter` | `node-exporter:9100` | Host | Host CPU, memory, load, filesystem, disk, and network telemetry |

`prometheus-fastapi-instrumentator` provides received-request metrics such as `http_requests_total` and `http_request_duration_seconds`. `/metrics` itself is excluded from HTTP instrumentation.

These HTTP metrics are distinct from Sentinel's outbound domain metrics:

| Metric | Type | Labels | Meaning |
| --- | --- | --- | --- |
| `sentinel_health_checks_total` | Counter | `service_id`, `status` | Total completed outbound health checks, labelled `online`, `degraded`, or `offline` |
| `sentinel_health_check_duration_seconds` | Histogram | `service_id` | Complete outbound health-check execution duration in seconds |
| `sentinel_open_incidents` | Gauge | none | Current persisted count of incidents with `status=open` |
| `sentinel_service_availability_ratio` | Gauge | `service_id` | Persisted availability in the preceding 24 hours: online checks divided by all checks |

For availability, degraded and offline checks are unavailable. Checks outside the UTC 24-hour window are excluded, and a service with no checks in the window emits no sample.

The incident and availability gauges query PostgreSQL on each scrape. Sessions are closed on success and failure. When database state is unknown, the affected collector omits its metric instead of emitting a misleading zero or breaking unrelated metrics.

Metric labels deliberately exclude service URL, service name, environment, reason, error messages, and exception text.

## Alert rules

Prometheus loads exactly five rules from `infra/prometheus/alerts.yml`:

| Alert | Expression | For | Severity | Operational meaning |
| --- | --- | --- | --- | --- |
| `SentinelBackendDown` | `up{job="sentinel-backend"} == 0` | 2m | critical | Prometheus cannot scrape the backend |
| `SentinelServiceAvailabilityLow` | `sentinel_service_availability_ratio < 0.95` | 5m | warning | A service's persisted 24-hour availability is below 95% |
| `SentinelOpenIncidents` | `sentinel_open_incidents > 0` | 2m | warning | One or more persisted incidents remain open |
| `SentinelIncidentMetricMissing` | `absent(sentinel_open_incidents) and on() (up{job="sentinel-backend"} == 1)` | 2m | warning | The backend is scrapeable but the database-backed incident metric is absent |
| `SentinelHealthCheckLatencyHigh` | `histogram_quantile(0.95, sum by (le, service_id) (rate(sentinel_health_check_duration_seconds_bucket[5m]))) > 2` | 5m | warning | Outbound health-check p95 exceeds two seconds for a service |

The missing-metric rule requires `up == 1`, avoiding a duplicate signal when the backend itself is down. None of the rules invents zero for an absent domain metric.

Prometheus forwards alerts to `alertmanager:9093`. Alertmanager is active with an internal `default` receiver but has no email, Slack, Discord, or other external destination configured.

## Grafana

Provisioning creates:

- Prometheus datasource `Sentinel Prometheus`, UID `sentinel-prometheus`;
- Loki datasource `Sentinel Loki`, UID `sentinel-loki`;
- dashboard UID `sentinel-overview`, titled **Sentinel Overview**, with 38 panels.

The dashboard separates Sentinel monitoring, API/runtime behavior, host/container infrastructure, and logs. Its domain panels show:

- current open incidents;
- 24-hour availability as a percentage per `service_id`;
- check rate by `service_id` and status;
- p95 outbound check duration per `service_id`;
- recent checks grouped by status.

The `service_id` variable supports multi-selection and an `All` option. The dashboard intentionally does not require service names or URLs as Prometheus labels.

## Logs

The backend writes structured-looking JSON log lines to stdout. Promtail uses Docker service discovery through the read-only Docker socket, parses Docker log envelopes, and attaches:

- `container`;
- `compose_service`;
- `compose_project`;
- `stream`;
- `job=docker-containers`.

Promtail sends records to Loki at `http://loki:3100/loki/api/v1/push`. Grafana queries Loki through the provisioned datasource. Alert delivery logs mask channel targets; database-backed metric collection errors are generic and omit database exception details.

Loki, Prometheus, Alertmanager, and Grafana use named volumes. Promtail's position file is local to its container and is not backed by a named volume.

## Health and operational checks

| Check | Command or endpoint | Interpretation |
| --- | --- | --- |
| API process | `curl --fail http://localhost/health` | FastAPI is responding; this endpoint does not query PostgreSQL |
| PostgreSQL | `docker compose exec postgres pg_isready -U sentinel -d sentinel` | Database accepts connections |
| Prometheus | `curl --fail http://localhost:9090/-/healthy` | Prometheus process is healthy |
| Backend scrape | query `up{job="sentinel-backend"}` in Prometheus | Value `1` confirms a successful scrape |
| Grafana | `curl --fail http://localhost:3000/api/health` | Grafana process and internal database are healthy |
| Compose state | `docker compose ps` | Container state and health checks |

## Investigation procedures

### Monitored service is offline

1. Filter the Sentinel UI by `offline` and inspect the service's latest HTTP status and error.
2. Review its check history and open incident in the UI/API.
3. In Grafana, select its `service_id` and compare check results with p95 duration.
4. Query Loki with `{compose_service="backend"}` around the failed check.
5. Verify the target URL independently from an equivalent network location; Sentinel may be healthy while the monitored target or route is not.

### Health-check latency increases

1. Inspect the **Health-check latency p95** panel for the affected `service_id`.
2. Compare it with status changes and `SentinelHealthCheckLatencyHigh`.
3. Check backend CPU/memory and cAdvisor telemetry to distinguish target latency from local resource pressure.
4. Review backend logs for timeouts or repeated network failures.

### An incident remains open

1. Confirm `sentinel_open_incidents` and inspect the incident in Sentinel.
2. Check whether recent results remain degraded/offline and whether the service is still active.
3. Review notification history to distinguish incident persistence from delivery failure.
4. If `SentinelIncidentMetricMissing` is firing instead, inspect PostgreSQL connectivity and backend collector logs; absence is not treated as zero.

### A container restarts

1. Run `docker compose ps` and inspect its state:

   ```bash
   docker inspect --format '{{.RestartCount}} {{.State.OOMKilled}} {{.State.ExitCode}}' sentinel-<service>-1
   ```

2. Correlate cAdvisor memory/CPU with container logs in Loki.
3. Use `docker compose logs --since=15m <service>` for startup errors.
4. Check whether the configured CPU or memory limit is too close to observed use before changing it.

### Logs are absent

1. Confirm Loki and Promtail are running with `docker compose ps`.
2. Inspect `docker compose logs promtail` for Docker discovery or push errors.
3. Confirm the Docker socket is mounted read-only and the expected container has a `compose_service` label.
4. Query Loki's label endpoint or Grafana Explore for the expected `compose_project="sentinel"`.
5. Check Loki logs and storage availability if Promtail discovers containers but pushes fail.

## Limitations

- There is no distributed tracing.
- Alertmanager has no external notification receiver.
- Prometheus and Loki use local retention/sizing suitable for demonstration, not a production capacity plan.
- Promtail is tied to the local Docker socket.
- The API health endpoint verifies process responsiveness, not database health.
