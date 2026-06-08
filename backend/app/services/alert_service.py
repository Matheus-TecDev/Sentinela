from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.alert import AlertChannel
from app.models.notification import NotificationLog
from app.repositories.alert_repository import AlertChannelRepository
from app.repositories.notification_repository import NotificationLogRepository
from app.schemas.alert import AlertChannelCreate, AlertChannelRead, AlertChannelUpdate, NotificationLogRead


def mask_target(value: str) -> str:
    if "@" in value and "://" not in value:
        user, domain = value.split("@", 1)
        user_mask = f"{user[:2]}***" if len(user) > 2 else "***"
        return f"{user_mask}@{domain}"
    if len(value) <= 16:
        return "****"
    return f"{value[:12]}...{value[-6:]}"


def serialize_alert_channel(channel: AlertChannel) -> AlertChannelRead:
    return AlertChannelRead(
        id=channel.id,
        service_id=channel.service_id,
        type=channel.type,
        masked_target=mask_target(channel.target),
        is_active=channel.is_active,
        notify_on_offline=channel.notify_on_offline,
        notify_on_degraded=channel.notify_on_degraded,
        notify_on_recovery=channel.notify_on_recovery,
        created_at=channel.created_at,
        updated_at=channel.updated_at,
    )


def serialize_notification_log(item: NotificationLog) -> NotificationLogRead:
    return NotificationLogRead(
        id=item.id,
        service_id=item.service_id,
        incident_id=item.incident_id,
        channel_type=item.channel_type,
        masked_target=mask_target(item.target),
        event_type=item.event_type,
        status=item.status,
        error_message=item.error_message,
        sent_at=item.sent_at,
    )


class AlertService:
    def __init__(self) -> None:
        self.channels = AlertChannelRepository()
        self.notifications = NotificationLogRepository()

    def list_channels(self, db: Session, service_id: int) -> list[AlertChannelRead]:
        return [serialize_alert_channel(channel) for channel in self.channels.list_for_service(db, service_id)]

    def create_channel(self, db: Session, service_id: int, payload: AlertChannelCreate) -> AlertChannelRead:
        channel = self.channels.create(db, {"service_id": service_id, **payload.model_dump()})
        return serialize_alert_channel(channel)

    def update_channel(
        self,
        db: Session,
        service_id: int,
        alert_id: int,
        payload: AlertChannelUpdate,
    ) -> AlertChannelRead:
        channel = self._get_channel_or_404(db, service_id, alert_id)
        data = payload.model_dump(exclude_unset=True)
        channel = self.channels.update(db, channel, data)
        return serialize_alert_channel(channel)

    def set_activation(self, db: Session, service_id: int, alert_id: int, is_active: bool) -> AlertChannelRead:
        channel = self._get_channel_or_404(db, service_id, alert_id)
        channel = self.channels.update(db, channel, {"is_active": is_active})
        return serialize_alert_channel(channel)

    def list_notifications(self, db: Session, service_id: int, limit: int = 50) -> list[NotificationLogRead]:
        return [
            serialize_notification_log(item)
            for item in self.notifications.list_for_service(db, service_id=service_id, limit=limit)
        ]

    def _get_channel_or_404(self, db: Session, service_id: int, alert_id: int) -> AlertChannel:
        channel = self.channels.get(db, alert_id)
        if channel is None or channel.service_id != service_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Canal de alerta não encontrado")
        return channel
