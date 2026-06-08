"""add incidents

Revision ID: 0002_incidents
Revises: 0001_initial
Create Date: 2026-06-08 10:20:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_incidents"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "incidents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("open", "resolved", native_enum=False, length=20),
            nullable=False,
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("reason", sa.String(length=120), nullable=False),
        sa.Column("last_error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_incidents_id"), "incidents", ["id"], unique=False)
    op.create_index(op.f("ix_incidents_service_id"), "incidents", ["service_id"], unique=False)
    op.create_index(op.f("ix_incidents_started_at"), "incidents", ["started_at"], unique=False)
    op.create_index(op.f("ix_incidents_status"), "incidents", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_incidents_status"), table_name="incidents")
    op.drop_index(op.f("ix_incidents_started_at"), table_name="incidents")
    op.drop_index(op.f("ix_incidents_service_id"), table_name="incidents")
    op.drop_index(op.f("ix_incidents_id"), table_name="incidents")
    op.drop_table("incidents")
