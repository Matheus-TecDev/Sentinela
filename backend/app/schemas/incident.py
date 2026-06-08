from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.core.enums import IncidentStatus


class IncidentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    service_id: int
    status: IncidentStatus
    started_at: datetime
    resolved_at: datetime | None
    duration_seconds: int | None
    reason: str
    last_error_message: str | None
    created_at: datetime
    updated_at: datetime


class IncidentWithService(IncidentRead):
    service_name: str
