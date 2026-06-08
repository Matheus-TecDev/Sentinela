from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.responsible import Responsible
from app.repositories.responsible_repository import ResponsibleRepository
from app.schemas.responsible import ResponsibleCreate, ResponsibleUpdate


class ResponsibleService:
    def __init__(self) -> None:
        self.responsibles = ResponsibleRepository()

    def list(self, db: Session, q: str | None = None, is_active: bool | None = None) -> list[Responsible]:
        return self.responsibles.list(db, q=q, is_active=is_active)

    def create(self, db: Session, payload: ResponsibleCreate) -> Responsible:
        return self.responsibles.create(db, payload.model_dump())

    def update(self, db: Session, responsible_id: int, payload: ResponsibleUpdate) -> Responsible:
        responsible = self._get_or_404(db, responsible_id)
        return self.responsibles.update(db, responsible, payload.model_dump(exclude_unset=True))

    def set_active(self, db: Session, responsible_id: int, is_active: bool) -> Responsible:
        responsible = self._get_or_404(db, responsible_id)
        return self.responsibles.update(db, responsible, {"is_active": is_active})

    def _get_or_404(self, db: Session, responsible_id: int) -> Responsible:
        responsible = self.responsibles.get(db, responsible_id)
        if responsible is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Responsável não encontrado")
        return responsible
