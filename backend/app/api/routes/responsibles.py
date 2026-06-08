from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import operator_access, viewer_access
from app.db.session import get_db
from app.models.user import User
from app.schemas.responsible import (
    ResponsibleActivationUpdate,
    ResponsibleCreate,
    ResponsibleRead,
    ResponsibleUpdate,
)
from app.services.responsible_service import ResponsibleService

router = APIRouter(prefix="/responsibles", tags=["responsibles"])
responsible_service = ResponsibleService()


@router.get("", response_model=list[ResponsibleRead])
def list_responsibles(
    q: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(viewer_access),
) -> list[ResponsibleRead]:
    return responsible_service.list(db, q=q, is_active=is_active)


@router.post("", response_model=ResponsibleRead, status_code=201)
def create_responsible(
    payload: ResponsibleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(operator_access),
) -> ResponsibleRead:
    return responsible_service.create(db, payload)


@router.put("/{responsible_id}", response_model=ResponsibleRead)
def update_responsible(
    responsible_id: int,
    payload: ResponsibleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(operator_access),
) -> ResponsibleRead:
    return responsible_service.update(db, responsible_id, payload)


@router.patch("/{responsible_id}/activation", response_model=ResponsibleRead)
def set_responsible_activation(
    responsible_id: int,
    payload: ResponsibleActivationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(operator_access),
) -> ResponsibleRead:
    return responsible_service.set_active(db, responsible_id, payload.is_active)
