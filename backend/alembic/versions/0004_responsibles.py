"""add structured responsibles

Revision ID: 0004_responsibles
Revises: 0003_alert_notifications
Create Date: 2026-06-08 14:20:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004_responsibles"
down_revision: Union[str, None] = "0003_alert_notifications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "responsibles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("team", sa.String(length=120), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_responsibles_id"), "responsibles", ["id"], unique=False)
    op.create_index(op.f("ix_responsibles_name"), "responsibles", ["name"], unique=False)

    op.add_column("services", sa.Column("responsible_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_services_responsible_id"), "services", ["responsible_id"], unique=False)
    op.create_foreign_key(
        "fk_services_responsible_id_responsibles",
        "services",
        "responsibles",
        ["responsible_id"],
        ["id"],
        ondelete="SET NULL",
    )

    connection = op.get_bind()
    owners = connection.execute(
        sa.text("select distinct owner from services where owner is not null and trim(owner) <> ''")
    ).fetchall()
    for row in owners:
        owner = row[0]
        responsible_id = connection.execute(
            sa.text(
                "insert into responsibles (name, is_active, created_at, updated_at) "
                "values (:name, true, now(), now()) returning id"
            ),
            {"name": owner},
        ).scalar_one()
        connection.execute(
            sa.text("update services set responsible_id = :responsible_id where owner = :owner"),
            {"responsible_id": responsible_id, "owner": owner},
        )


def downgrade() -> None:
    op.drop_constraint("fk_services_responsible_id_responsibles", "services", type_="foreignkey")
    op.drop_index(op.f("ix_services_responsible_id"), table_name="services")
    op.drop_column("services", "responsible_id")
    op.drop_index(op.f("ix_responsibles_name"), table_name="responsibles")
    op.drop_index(op.f("ix_responsibles_id"), table_name="responsibles")
    op.drop_table("responsibles")
