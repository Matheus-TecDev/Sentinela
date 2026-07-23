# Sentinel v1.0.0

Sentinel v1.0.0 is the first stable release of the self-hosted HTTP service monitoring platform.

## Included scope

- Periodic outbound health checks with configurable interval, timeout, degraded-latency threshold, and consecutive-failure threshold.
- Persistent `online`, `degraded`, and `offline` states with service history and 24-hour availability.
- Atomic health-check and incident persistence, automatic incident opening and resolution, and post-commit webhook or Discord notifications.
- JWT authentication and role-based access for administrators, operators, and viewers.
- A complete Docker Compose environment with PostgreSQL, backend, frontend, Nginx, and explicit resource limits.
- Prometheus metrics and five alert rules, Alertmanager routing, a provisioned 38-panel Grafana dashboard, centralized Loki logs, and host/container telemetry.
- Backend unit and PostgreSQL integration coverage, frontend type checking and production build validation, and GitHub Actions automation.

## Release validation

The release candidate was validated with all 11 Compose containers running without restarts or out-of-memory termination. The backend suite passed 73 tests, including real PostgreSQL integration tests. The frontend passed dependency audits with zero known vulnerabilities, TypeScript validation, and its production build.

Real screenshots of the application and observability dashboard are available in the [README](../README.md#release-evidence).

## Known limitations

- The deployment is a single-node demonstration without high availability or application-managed TLS.
- Scheduling runs inside one backend process and checks services sequentially.
- Notification delivery is post-commit but has no durable queue, transactional outbox, or coordinated retry worker.
- Alertmanager has no external receiver configured, and email delivery is not implemented.
- Prometheus and Grafana host ports require an external access-control layer outside an isolated local environment.
- The frontend production build succeeds but reports a JavaScript chunk larger than 500 kB.
