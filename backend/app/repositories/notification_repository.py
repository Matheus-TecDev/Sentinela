from __future__ import annotations

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.enums import NotificationStatus
from app.models.notification import NotificationLog
from app.models.service import MonitoredService


class NotificationLogRepository:
    def create(self, db: Session, data: dict) -> NotificationLog:
        item = NotificationLog(**data)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def list_for_service(self, db: Session, service_id: int, limit: int = 50) -> list[NotificationLog]:
        statement = (
            select(NotificationLog)
            .where(NotificationLog.service_id == service_id)
            .order_by(desc(NotificationLog.sent_at))
            .limit(limit)
        )
        return list(db.execute(statement).scalars().all())

    def recent_with_service(
        self,
        db: Session,
        limit: int = 10,
        status: NotificationStatus | None = None,
    ) -> list[tuple[NotificationLog, str]]:
        statement = (
            select(NotificationLog, MonitoredService.name)
            .join(MonitoredService, MonitoredService.id == NotificationLog.service_id)
            .order_by(desc(NotificationLog.sent_at))
            .limit(limit)
        )
        if status is not None:
            statement = statement.where(NotificationLog.status == status)
        return list(db.execute(statement).all())
