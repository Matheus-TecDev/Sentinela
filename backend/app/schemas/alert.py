from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.enums import AlertChannelType, NotificationEventType, NotificationStatus


class AlertChannelBase(BaseModel):
    type: AlertChannelType
    target: str = Field(..., min_length=5, max_length=2048)
    is_active: bool = True
    notify_on_offline: bool = True
    notify_on_degraded: bool = True
    notify_on_recovery: bool = True

    @field_validator("target")
    @classmethod
    def validate_target(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Informe o destino do alerta")
        return normalized


class AlertChannelCreate(AlertChannelBase):
    pass


class AlertChannelUpdate(BaseModel):
    type: AlertChannelType | None = None
    target: str | None = Field(default=None, min_length=5, max_length=2048)
    is_active: bool | None = None
    notify_on_offline: bool | None = None
    notify_on_degraded: bool | None = None
    notify_on_recovery: bool | None = None

    @field_validator("target")
    @classmethod
    def validate_optional_target(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            raise ValueError("Informe o destino do alerta")
        return normalized


class AlertChannelActivationUpdate(BaseModel):
    is_active: bool


class AlertChannelRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    service_id: int
    type: AlertChannelType
    masked_target: str
    is_active: bool
    notify_on_offline: bool
    notify_on_degraded: bool
    notify_on_recovery: bool
    created_at: datetime
    updated_at: datetime


class NotificationLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    service_id: int
    incident_id: int | None
    channel_type: AlertChannelType
    masked_target: str
    event_type: NotificationEventType
    status: NotificationStatus
    error_message: str | None
    sent_at: datetime


class NotificationLogWithService(NotificationLogRead):
    service_name: str
