"""
VigaMonitor - Backend FastAPI
Digital Twin - Structural Telemetry Server

WebSocket endpoint at /ws/telemetria
REST API at /api/*
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import get_pool, close_pool
from app import models
from app.routes import router
from app.schemas import TelemetryReading, TelemetryResponse
from app.ws_manager import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: pool created on first request
    yield
    # Shutdown
    await close_pool()


app = FastAPI(
    title="VigaMonitor",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.websocket("/ws/telemetria")
async def ws_telemetria(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            raw = await websocket.receive_json()
            reading = TelemetryReading(**raw)

            # Persistir en TimescaleDB
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

            # Broadcast a todos los clientes conectados
            ts = reading.timestamp or datetime.now(timezone.utc)
            response = TelemetryResponse(
                timestamp=ts.isoformat(),
                sensor_tipo=reading.sensor_tipo,
                sensor_id=reading.sensor_id,
                valor=reading.valor,
            )
            await manager.broadcast(response)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
