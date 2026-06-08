from datetime import datetime

from sqlalchemy.orm import Session

from app.core.enums import HealthStatus, IncidentStatus
from app.models.health_check import HealthCheckResult
from app.models.incident import Incident
from app.repositories.incident_repository import IncidentRepository


def incident_reason(status: HealthStatus) -> str:
    if status == HealthStatus.OFFLINE:
        return "Serviço offline"
    if status == HealthStatus.DEGRADED:
        return "Serviço degradado"
    return "Serviço recuperado"


def duration_seconds(started_at: datetime, resolved_at: datetime) -> int:
    return max(0, int((resolved_at - started_at).total_seconds()))


class IncidentService:
    def __init__(self) -> None:
        self.incidents = IncidentRepository()

    def sync_from_check(self, db: Session, check: HealthCheckResult) -> Incident | None:
        open_incident = self.incidents.open_for_service(db, check.service_id)

        if check.status in (HealthStatus.OFFLINE, HealthStatus.DEGRADED):
            data = {
                "reason": incident_reason(check.status),
                "last_error_message": check.error_message,
            }
            if open_incident:
                return self.incidents.update(db, open_incident, data)
            return self.incidents.create(
                db,
                {
                    "service_id": check.service_id,
                    "status": IncidentStatus.OPEN,
                    "started_at": check.checked_at,
                    **data,
                },
            )

        if check.status == HealthStatus.ONLINE and open_incident:
            return self.incidents.update(
                db,
                open_incident,
                {
                    "status": IncidentStatus.RESOLVED,
                    "resolved_at": check.checked_at,
                    "duration_seconds": duration_seconds(open_incident.started_at, check.checked_at),
                },
            )

        return None
