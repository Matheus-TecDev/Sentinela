from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.responsible import Responsible


class ResponsibleRepository:
    def get(self, db: Session, responsible_id: int) -> Responsible | None:
        return db.get(Responsible, responsible_id)

    def list(self, db: Session, q: str | None = None, is_active: bool | None = None) -> list[Responsible]:
        statement = select(Responsible)
        if q:
            normalized = q.strip()
            statement = statement.where(
                Responsible.name.ilike(f"%{normalized}%") | Responsible.email.ilike(f"%{normalized}%")
            )
        if is_active is not None:
            statement = statement.where(Responsible.is_active == is_active)
        statement = statement.order_by(Responsible.name.asc())
        return list(db.execute(statement).scalars().all())

    def create(self, db: Session, data: dict) -> Responsible:
        responsible = Responsible(**data)
        db.add(responsible)
        db.commit()
        db.refresh(responsible)
        return responsible

    def update(self, db: Session, responsible: Responsible, data: dict) -> Responsible:
        for key, value in data.items():
            setattr(responsible, key, value)
        db.add(responsible)
        db.commit()
        db.refresh(responsible)
        return responsible
