from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    OPERATOR = "OPERATOR"
    VIEWER = "VIEWER"


class ServiceEnvironment(str, Enum):
    DEV = "dev"
    STAGING = "staging"
    PRODUCTION = "production"


class HealthStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"


class IncidentStatus(str, Enum):
    OPEN = "open"
    RESOLVED = "resolved"


class AlertChannelType(str, Enum):
    WEBHOOK = "webhook"
    DISCORD = "discord"
    EMAIL = "email"


class NotificationEventType(str, Enum):
    INCIDENT_OPENED = "incident_opened"
    INCIDENT_RESOLVED = "incident_resolved"


class NotificationStatus(str, Enum):
    SENT = "sent"
    FAILED = "failed"
