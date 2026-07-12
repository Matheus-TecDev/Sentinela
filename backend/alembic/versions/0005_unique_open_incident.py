"""enforce one open incident per service

Revision ID: 0005_unique_open_incident
Revises: 0004_responsibles
Create Date: 2026-07-12 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005_unique_open_incident"
down_revision: Union[str, None] = "0004_responsibles"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEX_NAME = "uq_incidents_service_id_open"


def upgrade() -> None:
    op.create_index(
        INDEX_NAME,
        "incidents",
        ["service_id"],
        unique=True,
        postgresql_where=sa.text("status = 'open'"),
    )


def downgrade() -> None:
    op.drop_index(INDEX_NAME, table_name="incidents")
