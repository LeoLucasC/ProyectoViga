from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TelemetryReading(BaseModel):
    """Single telemetry reading received via WebSocket."""
    timestamp: datetime | None = None
    sensor_id: str = "bridge-01"
    sensor_tipo: str = Field(pattern=r"^(distancia|vibracion)$")
    valor: float
    unidad: str = "mm"


class TelemetryResponse(BaseModel):
    """Payload sent to WebSocket clients."""
    timestamp: str
    sensor_tipo: str
    sensor_id: str = "bridge-01"
    valor: float


class AggregatedPoint(BaseModel):
    """Point for chart display (matches frontend TelemetryPoint)."""
    timestamp: int  # epoch ms
    valor: float


class Threshold(BaseModel):
    sensor_tipo: str
    alert_valor: float
    critical_valor: float


class StatusResponse(BaseModel):
    status: str  # "ok"
    message: str


# ── Sensor schemas ──

class SensorCreate(BaseModel):
    sensor_tipo: str = Field(pattern=r"^(distancia|vibracion)$")
    nombre: str = Field(max_length=200)
    ubicacion: str = Field(max_length=200)
    sensor_id: str | None = Field(None, max_length=100)


class SensorUpdate(BaseModel):
    nombre: str | None = Field(None, max_length=200)
    ubicacion: str | None = Field(None, max_length=200)


class SensorResponse(BaseModel):
    sensor_id: str
    sensor_tipo: str
    nombre: str | None
    ubicacion: str | None
    activo: bool
    created_at: datetime
    online: bool = False
    reading_status: Literal["normal", "alert", "critical"] | None = None
    latest_valor: float | None = None
    latest_unidad: str | None = None
    latest_time: datetime | None = None
