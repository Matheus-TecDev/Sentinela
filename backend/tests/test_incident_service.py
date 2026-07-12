from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.exc import IntegrityError

from app.core.enums import HealthStatus, IncidentStatus, NotificationEventType
from app.models.health_check import HealthCheckResult
from app.models.incident import Incident
from app.repositories.incident_repository import IncidentRepository
from app.services.incident_service import IncidentService


class FakeIncidentRepository:
    def __init__(self) -> None:
        self.items: list[Incident] = []

    def open_for_service(self, _db: object, service_id: int) -> Incident | None:
        return next(
            (
                incident
                for incident in reversed(self.items)
                if incident.service_id == service_id and incident.status == IncidentStatus.OPEN
            ),
            None,
        )

    def create(self, _db: object, data: dict) -> Incident:
        incident = Incident(id=len(self.items) + 1, **data)
        self.items.append(incident)
        return incident

    def update(self, _db: object, incident: Incident, data: dict) -> Incident:
        for key, value in data.items():
            setattr(incident, key, value)
        return incident


class ConstraintDiagnostic:
    def __init__(self, constraint_name: str) -> None:
        self.constraint_name = constraint_name


class DatabaseError(Exception):
    def __init__(self, constraint_name: str) -> None:
        self.diag = ConstraintDiagnostic(constraint_name)


class FailingCommitSession:
    def __init__(self, error: IntegrityError) -> None:
        self.error = error
        self.rollback_calls = 0

    def add(self, _incident: Incident) -> None:
        pass

    def commit(self) -> None:
        raise self.error

    def rollback(self) -> None:
        self.rollback_calls += 1


@pytest.fixture
def incident_service() -> tuple[IncidentService, FakeIncidentRepository]:
    service = IncidentService()
    repository = FakeIncidentRepository()
    service.incidents = repository
    return service, repository


def make_check(
    status: HealthStatus,
    checked_at: datetime,
    error_message: str | None = None,
) -> HealthCheckResult:
    return HealthCheckResult(
        service_id=1,
        status=status,
        checked_at=checked_at,
        error_message=error_message,
    )


def make_integrity_error(constraint_name: str) -> IntegrityError:
    return IntegrityError(
        "insert into incidents",
        {},
        DatabaseError(constraint_name),
    )


def test_offline_result_opens_incident_and_persists_failure_context(incident_service) -> None:
    service, repository = incident_service
    checked_at = datetime(2026, 7, 11, 12, 0, tzinfo=timezone.utc)

    transition = service.sync_from_check(
        object(),
        make_check(HealthStatus.OFFLINE, checked_at, "Connection refused"),
    )

    assert transition is not None
    assert transition.event_type == NotificationEventType.INCIDENT_OPENED
    assert transition.incident.status == IncidentStatus.OPEN
    assert transition.incident.started_at == checked_at
    assert transition.incident.reason == "Serviço offline"
    assert transition.incident.last_error_message == "Connection refused"
    assert len(repository.items) == 1


def test_degraded_result_opens_incident(incident_service) -> None:
    service, repository = incident_service
    checked_at = datetime(2026, 7, 11, 12, 1, tzinfo=timezone.utc)

    transition = service.sync_from_check(
        object(),
        make_check(HealthStatus.DEGRADED, checked_at),
    )

    assert transition is not None
    assert transition.event_type == NotificationEventType.INCIDENT_OPENED
    assert transition.incident.status == IncidentStatus.OPEN
    assert transition.incident.reason == "Serviço degradado"
    assert len(repository.items) == 1


def test_repeated_unhealthy_result_updates_existing_incident(incident_service) -> None:
    service, repository = incident_service
    started_at = datetime(2026, 7, 11, 12, 0, tzinfo=timezone.utc)
    first_transition = service.sync_from_check(
        object(),
        make_check(HealthStatus.OFFLINE, started_at, "Connection refused"),
    )

    second_transition = service.sync_from_check(
        object(),
        make_check(HealthStatus.DEGRADED, started_at + timedelta(minutes=1), "Slow response"),
    )

    assert first_transition is not None
    assert second_transition is not None
    assert second_transition.event_type is None
    assert second_transition.incident is first_transition.incident
    assert second_transition.incident.reason == "Serviço degradado"
    assert second_transition.incident.last_error_message == "Slow response"
    assert len(repository.items) == 1


def test_online_result_resolves_incident_with_timestamp_and_duration(incident_service) -> None:
    service, repository = incident_service
    started_at = datetime(2026, 7, 11, 12, 0, tzinfo=timezone.utc)
    resolved_at = started_at + timedelta(minutes=2, seconds=15)
    service.sync_from_check(
        object(),
        make_check(HealthStatus.OFFLINE, started_at, "Request timed out"),
    )

    transition = service.sync_from_check(
        object(),
        make_check(HealthStatus.ONLINE, resolved_at),
    )

    assert transition is not None
    assert transition.event_type == NotificationEventType.INCIDENT_RESOLVED
    assert transition.incident.status == IncidentStatus.RESOLVED
    assert transition.incident.resolved_at == resolved_at
    assert transition.incident.duration_seconds == 135
    assert len(repository.items) == 1


def test_online_result_without_open_incident_produces_no_transition(incident_service) -> None:
    service, repository = incident_service
    checked_at = datetime(2026, 7, 11, 12, 0, tzinfo=timezone.utc)

    transition = service.sync_from_check(
        object(),
        make_check(HealthStatus.ONLINE, checked_at),
    )

    assert transition is None
    assert repository.items == []


def test_create_returns_competing_open_incident_after_unique_constraint_race(monkeypatch) -> None:
    repository = IncidentRepository()
    session = FailingCommitSession(make_integrity_error("uq_incidents_service_id_open"))
    competing_incident = Incident(id=42, service_id=1, status=IncidentStatus.OPEN, reason="Serviço offline")
    monkeypatch.setattr(repository, "open_for_service", lambda _db, _service_id: competing_incident)

    incident = repository.create(
        session,
        {
            "service_id": 1,
            "status": IncidentStatus.OPEN,
            "reason": "Serviço offline",
        },
    )

    assert incident is competing_incident
    assert session.rollback_calls == 1


def test_create_reraises_unrelated_integrity_error() -> None:
    repository = IncidentRepository()
    error = make_integrity_error("incidents_service_id_fkey")
    session = FailingCommitSession(error)

    with pytest.raises(IntegrityError) as raised:
        repository.create(
            session,
            {
                "service_id": 999,
                "status": IncidentStatus.OPEN,
                "reason": "Serviço offline",
            },
        )

    assert raised.value is error
    assert session.rollback_calls == 1
