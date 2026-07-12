"""Raw SQL queries for telemetry data."""

from datetime import datetime, timezone

import asyncpg


async def insert_reading(
    conn: asyncpg.Connection,
    sensor_id: str,
    sensor_tipo: str,
    valor: float,
    unidad: str,
    timestamp: datetime | None = None,
) -> None:
    ts = timestamp or datetime.now(timezone.utc)
    await conn.execute(
        """
        INSERT INTO telemetry_readings (time, sensor_id, sensor_tipo, valor, unidad)
        VALUES ($1, $2, $3, $4, $5)
        """,
        ts, sensor_id, sensor_tipo, valor, unidad,
    )


async def get_latest_readings(
    conn: asyncpg.Connection,
) -> list[dict]:
    rows = await conn.fetch(
        """
        SELECT DISTINCT ON (sensor_tipo)
            time, sensor_tipo, valor, unidad
        FROM telemetry_readings
        ORDER BY sensor_tipo, time DESC
        """
    )
    return [dict(r) for r in rows]


async def get_history(
    conn: asyncpg.Connection,
    sensor_tipo: str | None = None,
    limit: int = 50,
    since: datetime | None = None,
) -> list[dict]:
    query = "SELECT time, sensor_tipo, valor FROM telemetry_readings WHERE 1=1"
    params: list = []
    idx = 0

    if sensor_tipo:
        idx += 1
        query += f" AND sensor_tipo = ${idx}"
        params.append(sensor_tipo)
    if since:
        idx += 1
        query += f" AND time >= ${idx}"
        params.append(since)

    idx += 1
    query += f" ORDER BY time DESC LIMIT ${idx}"
    params.append(limit)

    rows = await conn.fetch(query, *params)
    return [dict(r) for r in rows]


async def get_thresholds(
    conn: asyncpg.Connection,
) -> list[dict]:
    rows = await conn.fetch("SELECT sensor_tipo, alert_valor, critical_valor FROM thresholds")
    return [dict(r) for r in rows]


async def update_threshold(
    conn: asyncpg.Connection,
    sensor_tipo: str,
    alert_valor: float,
    critical_valor: float,
) -> None:
    await conn.execute(
        """
        INSERT INTO thresholds (sensor_tipo, alert_valor, critical_valor, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (sensor_tipo)
        DO UPDATE SET alert_valor = $2, critical_valor = $3, updated_at = NOW()
        """,
        sensor_tipo, alert_valor, critical_valor,
    )


async def reset_data(conn: asyncpg.Connection) -> None:
    await conn.execute("DELETE FROM telemetry_readings")


# ── Sensor queries ──


async def get_all_sensors(conn: asyncpg.Connection) -> list[dict]:
    """Fetch all sensors with their latest reading via LEFT JOIN LATERAL."""
    rows = await conn.fetch(
        """
        SELECT
            s.sensor_id, s.sensor_tipo, s.nombre, s.ubicacion,
            s.activo, s.created_at,
            r.valor AS latest_valor, r.unidad AS latest_unidad, r.time AS latest_time
        FROM sensors s
        LEFT JOIN LATERAL (
            SELECT valor, unidad, time
            FROM telemetry_readings
            WHERE sensor_id = s.sensor_id
            ORDER BY time DESC
            LIMIT 1
        ) r ON TRUE
        ORDER BY s.created_at DESC
        """
    )
    return [dict(r) for r in rows]


async def get_sensor_by_id(
    conn: asyncpg.Connection, sensor_id: str
) -> dict | None:
    row = await conn.fetchrow(
        "SELECT * FROM sensors WHERE sensor_id = $1", sensor_id
    )
    return dict(row) if row else None


async def next_sensor_number(conn: asyncpg.Connection) -> int:
    """Find max bridge-NN number and return next."""
    row = await conn.fetchval(
        """
        SELECT MAX(CAST(SUBSTRING(sensor_id, 'bridge-([0-9]+)$') AS INTEGER))
        FROM sensors WHERE sensor_id ~ 'bridge-[0-9]+$'
        """
    )
    return (row or 0) + 1


async def create_sensor(
    conn: asyncpg.Connection,
    sensor_id: str,
    sensor_tipo: str,
    nombre: str,
    ubicacion: str,
) -> dict:
    row = await conn.fetchrow(
        """
        INSERT INTO sensors (sensor_id, sensor_tipo, nombre, ubicacion)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        """,
        sensor_id, sensor_tipo, nombre, ubicacion,
    )
    return dict(row)


async def update_sensor(
    conn: asyncpg.Connection,
    sensor_id: str,
    nombre: str | None = None,
    ubicacion: str | None = None,
) -> dict | None:
    sets: list[str] = []
    params: list = []
    idx = 0
    if nombre is not None:
        idx += 1
        sets.append(f"nombre = ${idx}")
        params.append(nombre)
    if ubicacion is not None:
        idx += 1
        sets.append(f"ubicacion = ${idx}")
        params.append(ubicacion)
    if not sets:
        return await get_sensor_by_id(conn, sensor_id)
    idx += 1
    params.append(sensor_id)
    row = await conn.fetchrow(
        f"UPDATE sensors SET {', '.join(sets)} WHERE sensor_id = ${idx} RETURNING *",
        *params,
    )
    return dict(row) if row else None


async def toggle_sensor_active(
    conn: asyncpg.Connection, sensor_id: str
) -> dict | None:
    row = await conn.fetchrow(
        """
        UPDATE sensors SET activo = NOT activo
        WHERE sensor_id = $1
        RETURNING *
        """,
        sensor_id,
    )
    return dict(row) if row else None


async def delete_sensor(
    conn: asyncpg.Connection, sensor_id: str
) -> bool:
    """Delete sensor and all its telemetry readings."""
    await conn.execute(
        "DELETE FROM telemetry_readings WHERE sensor_id = $1", sensor_id
    )
    result = await conn.execute(
        "DELETE FROM sensors WHERE sensor_id = $1", sensor_id
    )
    return result.endswith(" 1")
