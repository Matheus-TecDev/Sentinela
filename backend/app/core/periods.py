from datetime import datetime, timedelta, timezone
from typing import Literal

Period = Literal["24h", "7d", "30d"]

PERIOD_DELTAS: dict[str, timedelta] = {
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
}


def period_start(period: Period) -> datetime:
    return datetime.now(timezone.utc) - PERIOD_DELTAS[period]
