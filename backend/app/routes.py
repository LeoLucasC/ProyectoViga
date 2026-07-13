"""REST API endpoints for VigaMonitor."""

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.database import get_pool
from app import models
from app.schemas import (
    LoginRequest,
    LoginResponse,
    SensorCreate,
    SensorResponse,
    SensorUpdate,
    TelemetryReading,
    TelemetryResponse,
    Threshold,
    VigaCreate,
    VigaResponse,
    VigaUpdate,
)
from app.ws_manager import manager

# ── Sensor status constants ──

SENSOR_ONLINE_SECONDS = 30

# ── In-memory token store ──
# token -> username
_active_tokens: dict[str, str] = {}


class BatchTelemetry(BaseModel):
    readings: list[TelemetryReading]

router = APIRouter(prefix="/api")


@router.get("/health")
async def health():
    return {"status": "ok", "message": "VigaMonitor API running"}


@router.get("/latest")
async def latest():
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await models.get_latest_readings(conn)
    return {"data": rows}


@router.get("/history")
async def history(
    sensor_tipo: str | None = Query(None, pattern=r"^(distancia|vibracion)?$"),
    viga_id: int | None = Query(None, ge=1),
    limit: int = Query(100, ge=1, le=10000),
    since: str | None = None,
):
    since_dt: datetime | None = None
    if since:
        try:
            since_dt = datetime.fromisoformat(since)
        except ValueError:
            raise HTTPException(400, "Formato de fecha inválido. Usa ISO 8601.")

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await models.get_history(conn, sensor_tipo or None, viga_id, limit, since_dt)

    points = []
    for r in rows:
        point = {
            "timestamp": int(r["time"].timestamp() * 1000),
            "sensor_id": r["sensor_id"],
            "valor": r["valor"],
            "sensor_tipo": r["sensor_tipo"],
        }
        # Incluir parámetros detallados de vibración si existen
        for field in ["ax","ay","az","adx","ady","adz","aver","gx","gy","gz","temp","evento"]:
            val = r.get(field)
            if val is not None:
                point[field] = val
        points.append(point)
    return {"data": points, "total": len(points)}


@router.get("/thresholds", response_model=list[Threshold])
async def get_thresholds():
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await models.get_thresholds(conn)
    return [Threshold(**r) for r in rows]


@router.put("/thresholds")
async def update_thresholds(threshold: Threshold):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await models.update_threshold(
            conn,
            threshold.sensor_tipo,
            threshold.alert_valor,
            threshold.critical_valor,
        )
    return {"status": "ok", "message": f"Thresholds for '{threshold.sensor_tipo}' updated"}


@router.post("/telemetry")
async def post_telemetry(reading: TelemetryReading):
    """Endpoint para ESP32 — envía lecturas vía HTTP POST."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await models.insert_reading(
            conn,
            sensor_id=reading.sensor_id,
            sensor_tipo=reading.sensor_tipo,
            valor=reading.valor,
            unidad=reading.unidad,
            timestamp=reading.timestamp,
            viga_id=reading.viga_id,
            ax=reading.ax, ay=reading.ay, az=reading.az,
            adx=reading.adx, ady=reading.ady, adz=reading.adz, aver=reading.aver,
            gx=reading.gx, gy=reading.gy, gz=reading.gz,
            temp=reading.temp, evento=reading.evento,
        )

    ts = reading.timestamp or datetime.now(timezone.utc)
    response = TelemetryResponse(
        timestamp=ts.isoformat(),
        sensor_tipo=reading.sensor_tipo,
        sensor_id=reading.sensor_id,
        valor=reading.valor,
    )
    await manager.broadcast(response)

    return {"status": "ok"}


@router.post("/telemetry/batch")
async def post_telemetry_batch(batch: BatchTelemetry):
    """Endpoint para ESP32 — envía múltiples lecturas en un solo POST."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        for reading in batch.readings:
            await models.insert_reading(
                conn,
                sensor_id=reading.sensor_id,
                sensor_tipo=reading.sensor_tipo,
                valor=reading.valor,
                unidad=reading.unidad,
                timestamp=reading.timestamp,
                viga_id=reading.viga_id,
                ax=reading.ax, ay=reading.ay, az=reading.az,
                adx=reading.adx, ady=reading.ady, adz=reading.adz, aver=reading.aver,
                gx=reading.gx, gy=reading.gy, gz=reading.gz,
                temp=reading.temp, evento=reading.evento,
            )
            ts = reading.timestamp or datetime.now(timezone.utc)
            response = TelemetryResponse(
                timestamp=ts.isoformat(),
                sensor_tipo=reading.sensor_tipo,
                sensor_id=reading.sensor_id,
                valor=reading.valor,
            )
            await manager.broadcast(response)

    return {"status": "ok", "count": len(batch.readings)}


@router.post("/reset")
async def reset_data():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await models.reset_data(conn)
    return {"status": "ok", "message": "All telemetry data deleted"}


# ── Auth endpoints ──


@router.post("/login")
async def login(data: LoginRequest):
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await models.get_user_by_username(conn, data.username)

    if not user or not models.verify_password(data.password, user["password"]):
        raise HTTPException(401, "Usuario o contraseña incorrectos")

    token = secrets.token_hex(32)
    _active_tokens[token] = user["username"]

    return LoginResponse(token=token, username=user["username"])


@router.get("/me")
async def me(token: str = Query(...)):
    username = _active_tokens.get(token)
    if not username:
        raise HTTPException(401, "Token inválido o expirado")

    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await models.get_user_by_username(conn, username)

    if not user:
        raise HTTPException(404, "Usuario no encontrado")

    return {"username": user["username"], "email": user["email"]}


@router.post("/logout")
async def logout(token: str = Query(...)):
    if token in _active_tokens:
        del _active_tokens[token]
    return {"status": "ok", "message": "Sesión cerrada"}


# ── Viga endpoints ──


@router.get("/vigas", response_model=list[VigaResponse])
async def list_vigas():
    pool = await get_pool()
    async with pool.acquire() as conn:
        raw = await models.get_all_vigas(conn)
    return [VigaResponse(**r) for r in raw]


@router.post("/vigas", status_code=201, response_model=VigaResponse)
async def create_viga(data: VigaCreate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        created = await models.create_viga(conn, data.nombre, data.ubicacion)
    return VigaResponse(**created)


@router.put("/vigas/{viga_id}", response_model=VigaResponse)
async def update_viga(viga_id: int, data: VigaUpdate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        updated = await models.update_viga(conn, viga_id, data.nombre, data.ubicacion)
        if not updated:
            raise HTTPException(404, f"Viga '{viga_id}' no encontrada")
    return VigaResponse(**updated)


@router.delete("/vigas/{viga_id}")
async def delete_viga(viga_id: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        deleted = await models.delete_viga(conn, viga_id)
    if not deleted:
        raise HTTPException(404, f"Viga '{viga_id}' no encontrada")
    return {"status": "ok", "message": f"Viga '{viga_id}' eliminada"}


# ── Sensor endpoints ──


def _compute_reading_status(
    valor: float | None,
    alert_valor: float,
    critical_valor: float,
) -> str | None:
    if valor is None:
        return None
    if valor >= critical_valor:
        return "critical"
    if valor >= alert_valor:
        return "alert"
    return "normal"


@router.get("/sensors", response_model=list[SensorResponse])
async def list_sensors():
    pool = await get_pool()
    async with pool.acquire() as conn:
        raw = await models.get_all_sensors(conn)
        thresholds_raw = await models.get_thresholds(conn)

    thresholds_map = {
        t["sensor_tipo"]: (t["alert_valor"], t["critical_valor"])
        for t in thresholds_raw
    }
    now = datetime.now(timezone.utc)

    result = []
    for r in raw:
        alert_v, critical_v = thresholds_map.get(
            r["sensor_tipo"], (40.0, 60.0)
        )

        online = False
        reading_status: str | None = None
        if r.get("latest_time"):
            elapsed = (now - r["latest_time"].replace(tzinfo=timezone.utc)).total_seconds()
            online = elapsed < SENSOR_ONLINE_SECONDS
            reading_status = _compute_reading_status(
                r.get("latest_valor"), alert_v, critical_v
            )

        result.append(
            SensorResponse(
                sensor_id=r["sensor_id"],
                sensor_tipo=r["sensor_tipo"],
                nombre=r.get("nombre"),
                ubicacion=r.get("ubicacion"),
                activo=r["activo"],
                created_at=r["created_at"],
                online=online,
                reading_status=reading_status,
                latest_valor=r.get("latest_valor"),
                latest_unidad=r.get("latest_unidad"),
                latest_time=r.get("latest_time"),
            )
        )

    return result


@router.get("/sensors/next-id")
async def get_next_sensor_id():
    pool = await get_pool()
    async with pool.acquire() as conn:
        n = await models.next_sensor_number(conn)
    return {"sensor_id": f"bridge-{n:02d}"}


@router.post("/sensors", status_code=201, response_model=SensorResponse)
async def create_sensor(data: SensorCreate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        sensor_id = data.sensor_id
        if not sensor_id:
            n = await models.next_sensor_number(conn)
            sensor_id = f"bridge-{n:02d}"
        else:
            existing = await models.get_sensor_by_id(conn, sensor_id)
            if existing:
                raise HTTPException(409, f"Sensor '{sensor_id}' ya existe")

        created = await models.create_sensor(
            conn, sensor_id, data.sensor_tipo, data.nombre, data.ubicacion
        )

        thresholds_raw = await models.get_thresholds(conn)
        thresholds_map = {
            t["sensor_tipo"]: (t["alert_valor"], t["critical_valor"])
            for t in thresholds_raw
        }
        alert_v, critical_v = thresholds_map.get(data.sensor_tipo, (40.0, 60.0))

    return SensorResponse(
        sensor_id=created["sensor_id"],
        sensor_tipo=created["sensor_tipo"],
        nombre=created.get("nombre"),
        ubicacion=created.get("ubicacion"),
        activo=created["activo"],
        created_at=created["created_at"],
        online=False,
        reading_status=None,
        latest_valor=None,
        latest_unidad=None,
        latest_time=None,
    )


@router.put("/sensors/{sensor_id}", response_model=SensorResponse)
async def update_sensor(sensor_id: str, data: SensorUpdate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        updated = await models.update_sensor(
            conn, sensor_id, nombre=data.nombre, ubicacion=data.ubicacion
        )
        if not updated:
            raise HTTPException(404, f"Sensor '{sensor_id}' no encontrado")
    return SensorResponse(
        sensor_id=updated["sensor_id"],
        sensor_tipo=updated["sensor_tipo"],
        nombre=updated.get("nombre"),
        ubicacion=updated.get("ubicacion"),
        activo=updated["activo"],
        created_at=updated["created_at"],
    )


@router.patch("/sensors/{sensor_id}/toggle", response_model=SensorResponse)
async def toggle_sensor(sensor_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        toggled = await models.toggle_sensor_active(conn, sensor_id)
        if not toggled:
            raise HTTPException(404, f"Sensor '{sensor_id}' no encontrado")
    return SensorResponse(
        sensor_id=toggled["sensor_id"],
        sensor_tipo=toggled["sensor_tipo"],
        nombre=toggled.get("nombre"),
        ubicacion=toggled.get("ubicacion"),
        activo=toggled["activo"],
        created_at=toggled["created_at"],
    )


@router.delete("/sensors/{sensor_id}")
async def delete_sensor(sensor_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        deleted = await models.delete_sensor(conn, sensor_id)

    if not deleted:
        raise HTTPException(404, f"Sensor '{sensor_id}' no encontrado")

    return {"status": "ok", "message": f"Sensor '{sensor_id}' y sus lecturas eliminados"}
