from pydantic import BaseModel

from app.schemas.health_check import HealthCheckResultRead
from app.schemas.incident import IncidentWithService
from app.schemas.service import ServiceWithStatus


class ServiceInstabilitySummary(BaseModel):
    service_id: int
    service_name: str
    unhealthy_checks: int
    failure_checks: int
    incident_count: int


class ServiceResponseSummary(BaseModel):
    service_id: int
    service_name: str
    average_response_time_ms: float


class DashboardSummary(BaseModel):
    total_services: int
    online_services: int
    offline_services: int
    degraded_services: int
    inactive_services: int
    average_response_time_ms: float | None
    overall_uptime_percent: float
    open_incidents: int
    failures_last_24h: int
    recent_failures: list[HealthCheckResultRead]
    recent_incidents: list[IncidentWithService]
    unstable_services: list[ServiceInstabilitySummary]
    slowest_services: list[ServiceResponseSummary]
    services: list[ServiceWithStatus]
