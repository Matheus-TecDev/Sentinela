from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import viewer_access
from app.core.enums import IncidentStatus
from app.db.session import get_db
from app.models.user import User
from app.repositories.incident_repository import IncidentRepository
from app.schemas.incident import IncidentRead

router = APIRouter(prefix="/incidents", tags=["incidents"])
incident_repository = IncidentRepository()


@router.get("", response_model=list[IncidentRead])
def list_incidents(
    status: IncidentStatus | None = Query(default=None),
    service_id: int | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(viewer_access),
) -> list[IncidentRead]:
    return incident_repository.list(db, status=status, service_id=service_id, limit=limit)
