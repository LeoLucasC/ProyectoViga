"""Raw SQL queries for telemetry data."""

import hashlib
import os
from datetime import datetime, timezone

import asyncpg


# ── Password helpers ──

def hash_password(password: str) -> str:
    salt = os.urandom(32).hex()
    pwd_hash = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${pwd_hash}"


def verify_password(password: str, stored: str) -> bool:
    salt, pwd_hash = stored.split("$")
    return hashlib.sha256((salt + password).encode()).hexdigest() == pwd_hash


# ── User queries ──

async def create_users_table(conn: asyncpg.Connection) -> None:
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id          SERIAL PRIMARY KEY,
            username    VARCHAR(100) UNIQUE NOT NULL,
            email       VARCHAR(200) UNIQUE NOT NULL,
            password    VARCHAR(255) NOT NULL,
            created_at  TIMESTAMPTZ DEFAULT NOW()
        )
    """)


async def seed_default_user(conn: asyncpg.Connection) -> None:
    exists = await conn.fetchval("SELECT 1 FROM users WHERE username = 'admin'")
    if not exists:
        await conn.execute(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
            "admin", "admin@vigamonitor.com", hash_password("admin123"),
        )
        print("✓ Usuario admin creado (admin / admin123)")


# ── Viga queries ──

async def get_all_vigas(conn: asyncpg.Connection) -> list[dict]:
    rows = await conn.fetch(
        "SELECT viga_id, nombre, ubicacion, created_at FROM vigas ORDER BY created_at DESC"
    )
    return [dict(r) for r in rows]


async def get_viga_by_id(conn: asyncpg.Connection, viga_id: int) -> dict | None:
    row = await conn.fetchrow(
        "SELECT viga_id, nombre, ubicacion, created_at FROM vigas WHERE viga_id = $1",
        viga_id,
    )
    return dict(row) if row else None


async def create_viga(conn: asyncpg.Connection, nombre: str, ubicacion: str) -> dict:
    row = await conn.fetchrow(
        "INSERT INTO vigas (nombre, ubicacion) VALUES ($1, $2) RETURNING *",
        nombre, ubicacion,
    )
    return dict(row)


async def update_viga(conn: asyncpg.Connection, viga_id: int, nombre: str, ubicacion: str) -> dict | None:
    row = await conn.fetchrow(
        "UPDATE vigas SET nombre = $1, ubicacion = $2 WHERE viga_id = $3 RETURNING *",
        nombre, ubicacion, viga_id,
    )
    return dict(row) if row else None


async def delete_viga(conn: asyncpg.Connection, viga_id: int) -> bool:
    await conn.execute("UPDATE telemetry_readings SET viga_id = NULL WHERE viga_id = $1", viga_id)
    result = await conn.execute("DELETE FROM vigas WHERE viga_id = $1", viga_id)
    return result.endswith(" 1")


async def get_user_by_username(conn: asyncpg.Connection, username: str) -> dict | None:
    row = await conn.fetchrow("SELECT * FROM users WHERE username = $1", username)
    return dict(row) if row else None


async def ensure_sensor_exists(conn: asyncpg.Connection, sensor_id: str, sensor_tipo: str) -> None:
    """Create the sensor if it doesn't exist yet (auto-register on first reading)."""
    exists = await conn.fetchval(
        "SELECT 1 FROM sensors WHERE sensor_id = $1", sensor_id
    )
    if not exists:
        await conn.execute(
            """
            INSERT INTO sensors (sensor_id, sensor_tipo, nombre, ubicacion)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (sensor_id) DO NOTHING
            """,
            sensor_id, sensor_tipo, f"Sensor {sensor_id}", "Ubicación automática",
        )


async def insert_reading(
    conn: asyncpg.Connection,
    sensor_id: str,
    sensor_tipo: str,
    valor: float,
    unidad: str,
    timestamp: datetime | None = None,
    viga_id: int | None = None,
    distancia_raw: float | None = None,
    distancia_corregida: float | None = None,
    distancia_mediana_raw: float | None = None,
    distancia_mediana_corregida: float | None = None,
    deflexion_raw: float | None = None,
    deflexion_filtrada: float | None = None,
    referencia_mm: float | None = None,
    ax: float | None = None,
    ay: float | None = None,
    az: float | None = None,
    adx: float | None = None,
    ady: float | None = None,
    adz: float | None = None,
    aver: float | None = None,
    gx: float | None = None,
    gy: float | None = None,
    gz: float | None = None,
    temp: float | None = None,
    evento: int | None = None,
) -> None:
    ts = timestamp or datetime.now(timezone.utc)
    await ensure_sensor_exists(conn, sensor_id, sensor_tipo)
    if viga_id is None:
        first = await conn.fetchval("SELECT viga_id FROM vigas ORDER BY viga_id LIMIT 1")
        viga_id = first
    await conn.execute(
        """
        INSERT INTO telemetry_readings
            (time, sensor_id, sensor_tipo, valor, unidad, viga_id,
             distancia_raw, distancia_corregida, distancia_mediana_raw,
             distancia_mediana_corregida, deflexion_raw, deflexion_filtrada,
             referencia_mm,
             ax, ay, az, adx, ady, adz, aver,
             gx, gy, gz, temp, evento)
        VALUES ($1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25)
        """,
        ts, sensor_id, sensor_tipo, valor, unidad, viga_id,
        distancia_raw, distancia_corregida, distancia_mediana_raw,
        distancia_mediana_corregida, deflexion_raw, deflexion_filtrada,
        referencia_mm,
        ax, ay, az, adx, ady, adz, aver,
        gx, gy, gz, temp, evento,
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
    viga_id: int | None = None,
    limit: int = 50,
    since: datetime | None = None,
) -> list[dict]:
    query = """SELECT time, sensor_id, sensor_tipo, valor, unidad, viga_id,
                      distancia_raw, distancia_corregida, distancia_mediana_raw,
                      distancia_mediana_corregida, deflexion_raw, deflexion_filtrada,
                      referencia_mm,
                      ax, ay, az, adx, ady, adz, aver,
                      gx, gy, gz, temp, evento
               FROM telemetry_readings WHERE 1=1"""
    params: list = []
    idx = 0

    if sensor_tipo:
        idx += 1
        query += f" AND sensor_tipo = ${idx}"
        params.append(sensor_tipo)
    if viga_id is not None:
        idx += 1
        query += f" AND viga_id = ${idx}"
        params.append(viga_id)
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
