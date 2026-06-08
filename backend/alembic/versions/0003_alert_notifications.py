"""add alert channels and notification logs

Revision ID: 0003_alert_notifications
Revises: 0002_incidents
Create Date: 2026-06-08 13:10:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_alert_notifications"
down_revision: Union[str, None] = "0002_incidents"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "alert_channels",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.Enum("webhook", "discord", "email", native_enum=False, length=20), nullable=False),
        sa.Column("target", sa.String(length=2048), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("notify_on_offline", sa.Boolean(), nullable=False),
        sa.Column("notify_on_degraded", sa.Boolean(), nullable=False),
        sa.Column("notify_on_recovery", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_alert_channels_id"), "alert_channels", ["id"], unique=False)
    op.create_index(op.f("ix_alert_channels_service_id"), "alert_channels", ["service_id"], unique=False)
    op.create_index(op.f("ix_alert_channels_type"), "alert_channels", ["type"], unique=False)

    op.create_table(
        "notification_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.Column("incident_id", sa.Integer(), nullable=True),
        sa.Column("channel_type", sa.Enum("webhook", "discord", "email", native_enum=False, length=20), nullable=False),
        sa.Column("target", sa.String(length=2048), nullable=False),
        sa.Column(
            "event_type",
            sa.Enum("incident_opened", "incident_resolved", native_enum=False, length=40),
            nullable=False,
        ),
        sa.Column("status", sa.Enum("sent", "failed", native_enum=False, length=20), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["incident_id"], ["incidents.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notification_logs_event_type"), "notification_logs", ["event_type"], unique=False)
    op.create_index(op.f("ix_notification_logs_id"), "notification_logs", ["id"], unique=False)
    op.create_index(op.f("ix_notification_logs_incident_id"), "notification_logs", ["incident_id"], unique=False)
    op.create_index(op.f("ix_notification_logs_sent_at"), "notification_logs", ["sent_at"], unique=False)
    op.create_index(op.f("ix_notification_logs_service_id"), "notification_logs", ["service_id"], unique=False)
    op.create_index(op.f("ix_notification_logs_status"), "notification_logs", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_notification_logs_status"), table_name="notification_logs")
    op.drop_index(op.f("ix_notification_logs_service_id"), table_name="notification_logs")
    op.drop_index(op.f("ix_notification_logs_sent_at"), table_name="notification_logs")
    op.drop_index(op.f("ix_notification_logs_incident_id"), table_name="notification_logs")
    op.drop_index(op.f("ix_notification_logs_id"), table_name="notification_logs")
    op.drop_index(op.f("ix_notification_logs_event_type"), table_name="notification_logs")
    op.drop_table("notification_logs")
    op.drop_index(op.f("ix_alert_channels_type"), table_name="alert_channels")
    op.drop_index(op.f("ix_alert_channels_service_id"), table_name="alert_channels")
    op.drop_index(op.f("ix_alert_channels_id"), table_name="alert_channels")
    op.drop_table("alert_channels")
