from prometheus_client import REGISTRY, CollectorRegistry, Counter, Histogram

from app.core.enums import HealthStatus


class HealthCheckMetrics:
    def __init__(self, registry: CollectorRegistry) -> None:
        self.total = Counter(
            "sentinel_health_checks",
            "Total outbound health checks performed by Sentinel.",
            labelnames=("service_id", "status"),
            registry=registry,
        )
        self.duration_seconds = Histogram(
            "sentinel_health_check_duration_seconds",
            "Duration of outbound health checks performed by Sentinel in seconds.",
            labelnames=("service_id",),
            registry=registry,
        )

    def record(self, service_id: int, status: HealthStatus, duration_seconds: float) -> None:
        service_id_label = str(service_id)
        self.total.labels(service_id=service_id_label, status=status.value).inc()
        self.duration_seconds.labels(service_id=service_id_label).observe(duration_seconds)


health_check_metrics = HealthCheckMetrics(REGISTRY)
