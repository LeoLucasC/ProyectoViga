"""Manages WebSocket connections and broadcasts telemetry data to clients."""

from fastapi import WebSocket
from app.schemas import TelemetryResponse


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: TelemetryResponse) -> None:
        stale: list[WebSocket] = []
        for ws in self.active_connections:
            try:
                await ws.send_json(data.model_dump())
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.active_connections.remove(ws)


manager = ConnectionManager()
