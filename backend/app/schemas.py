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
    viga_id: int | None = None
    # Parámetros completos de distancia (VL53L1X) — opcionales
    distancia_raw: float | None = None
    distancia_corregida: float | None = None
    distancia_mediana_raw: float | None = None
    distancia_mediana_corregida: float | None = None
    deflexion_raw: float | None = None
    deflexion_filtrada: float | None = None
    referencia_mm: float | None = None
    # Parámetros completos de vibración (MPU9250) — opcionales
    ax: float | None = None
    ay: float | None = None
    az: float | None = None
    adx: float | None = None
    ady: float | None = None
    adz: float | None = None
    aver: float | None = None
    gx: float | None = None
    gy: float | None = None
    gz: float | None = None
    temp: float | None = None
    evento: int | None = None


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
    viga_id: int | None = None


class SensorUpdate(BaseModel):
    nombre: str | None = Field(None, max_length=200)
    ubicacion: str | None = Field(None, max_length=200)
    viga_id: int | None = None


class SensorResponse(BaseModel):
    sensor_id: str
    sensor_tipo: str
    nombre: str | None
    ubicacion: str | None
    activo: bool
    created_at: datetime
    viga_id: int | None = None
    online: bool = False
    reading_status: Literal["normal", "alert", "critical"] | None = None
    latest_valor: float | None = None
    latest_unidad: str | None = None
    latest_time: datetime | None = None


# ── Viga schemas ──

class VigaResponse(BaseModel):
    viga_id: int
    nombre: str
    ubicacion: str
    created_at: datetime


class VigaCreate(BaseModel):
    nombre: str = Field(max_length=200)
    ubicacion: str = Field(max_length=200)


class VigaUpdate(BaseModel):
    nombre: str = Field(max_length=200)
    ubicacion: str = Field(max_length=200)


# ── Auth schemas ──

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
    message: str = "Inicio de sesión exitoso"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
