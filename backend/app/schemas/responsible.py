from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResponsibleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: str | None = Field(default=None, max_length=255)
    team: str | None = Field(default=None, max_length=120)
    is_active: bool = True


class ResponsibleCreate(ResponsibleBase):
    pass


class ResponsibleUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: str | None = Field(default=None, max_length=255)
    team: str | None = Field(default=None, max_length=120)
    is_active: bool | None = None


class ResponsibleActivationUpdate(BaseModel):
    is_active: bool


class ResponsibleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str | None
    team: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
