import asyncio
import asyncpg
import logging
from urllib.parse import urlparse
from app.config import settings

# 1. Configurar los logs para ver el detalle de la conexión
logging.basicConfig(
    level=logging.DEBUG, 
    format='%(asctime)s - %(levelname)s - %(message)s'
)

async def create_database(conn: asyncpg.Connection, db_name: str) -> None:
    """Create database if it doesn't exist."""
    exists = await conn.fetchval(
        "SELECT 1 FROM pg_database WHERE datname = $1", db_name
    )
    if not exists:
        await conn.execute(f'CREATE DATABASE "{db_name}"')
        logging.info(f"✓ Base de datos '{db_name}' creada.")
    else:
        logging.info(f"- La base de datos '{db_name}' ya existe.")

async def seed() -> None:
    dsn = str(settings.database_dsn)
    
    # 2. Reemplazo seguro del nombre de la BD manteniendo los parámetros (como ?ssl=disable)
    parsed = urlparse(dsn)
    admin_dsn = dsn.replace(parsed.path, "/postgres")

    logging.info("🔌 Fase 1: Conectando a PostgreSQL (Administrador)...")
    logging.debug(f"DSN original: {dsn}")
    logging.debug(f"Admin DSN: {admin_dsn}")

    # FASE 1: CREAR BASE DE DATOS
    try:
        admin_conn = await asyncpg.connect(admin_dsn)
        try:
            await create_database(admin_conn, "vigamonitor")
        finally:
            await admin_conn.close()
    except Exception as e:
        logging.error(f"❌ Falló la conexión de administrador: {type(e).__name__} -> {e}")
        logging.error("Asegúrate de usar 127.0.0.1 en tu .env en lugar de localhost.")
        return # Salimos del script si no podemos ni crear la base de datos

    # FASE 2: INYECTAR TABLAS Y DATOS
    logging.info("📦 Fase 2: Conectando a la base de datos 'vigamonitor'...")
    try:
        conn = await asyncpg.connect(dsn)
        
        try:
            # --- Extensions ---
            logging.info("📦 Habilitando extensiones...")
            try:
                await conn.execute("CREATE EXTENSION IF NOT EXISTS timescaledb")
                logging.info("✓ Extensión TimescaleDB habilitada")
            except Exception as e:
                logging.warning(f"⚠ TimescaleDB no disponible (se omitirá hypertable): {e}")

            # --- Tables ---
            logging.info("🏗️ Creando tablas...")
            
            # --- SOLUCIÓN PARA POSTGRESQL 15+ ---
            await conn.execute("CREATE SCHEMA IF NOT EXISTS public")
            await conn.execute("SET search_path TO public")
            # ------------------------------------

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS thresholds (
                    sensor_tipo    VARCHAR(50) PRIMARY KEY,
                    alert_valor    DOUBLE PRECISION NOT NULL,
                    critical_valor DOUBLE PRECISION NOT NULL,
                    updated_at     TIMESTAMPTZ DEFAULT NOW(),
                    CONSTRAINT chk_thresholds CHECK (alert_valor < critical_valor)
                )
            """)
            logging.info("✓ Tabla: thresholds")

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS sensors (
                    sensor_id   VARCHAR(100) PRIMARY KEY,
                    sensor_tipo VARCHAR(50) NOT NULL REFERENCES thresholds(sensor_tipo),
                    nombre      VARCHAR(200),
                    ubicacion   VARCHAR(200),
                    activo      BOOLEAN DEFAULT TRUE,
                    created_at  TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            logging.info("✓ Tabla: sensors")

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS telemetry_readings (
                    time        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    sensor_id   VARCHAR(100) NOT NULL REFERENCES sensors(sensor_id),
                    sensor_tipo VARCHAR(50) NOT NULL REFERENCES thresholds(sensor_tipo),
                    valor       DOUBLE PRECISION NOT NULL,
                    unidad      VARCHAR(20) NOT NULL,
                    CONSTRAINT chk_unidad CHECK (
                        (sensor_tipo = 'distancia' AND unidad = 'mm') OR
                        (sensor_tipo = 'vibracion' AND unidad = 'm/s²')
                    )
                )
            """)
            logging.info("✓ Tabla: telemetry_readings")

            # --- Hypertable ---
            try:
                await conn.execute(
                    "SELECT create_hypertable('telemetry_readings', 'time', if_not_exists => TRUE)"
                )
                logging.info("✓ Convertida a hypertable")
            except Exception:
                logging.info("- Conversión a Hypertable omitida (TimescaleDB no disponible)")

            # --- Indexes ---
            logging.info("📊 Creando índices...")
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_readings_sensor_tipo_time
                    ON telemetry_readings (sensor_tipo, time DESC)
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_readings_sensor_id_time
                    ON telemetry_readings (sensor_id, time DESC)
            """)
            logging.info("✓ Índices creados")

            # --- Seed data ---
            logging.info("🌱 Inyectando datos semilla...")
            await conn.execute("""
                INSERT INTO thresholds (sensor_tipo, alert_valor, critical_valor)
                VALUES
                    ('distancia', 40.0, 60.0),
                    ('vibracion', 0.8, 1.5)
                ON CONFLICT (sensor_tipo) DO NOTHING
            """)
            logging.info("✓ Thresholds inyectados")

            await conn.execute("""
                INSERT INTO sensors (sensor_id, sensor_tipo, nombre, ubicacion)
                VALUES
                    ('bridge-01', 'distancia', 'Sensor de Deflexión A', 'Centro del vano'),
                    ('bridge-02', 'vibracion', 'Sensor de Vibración B', 'Cuarto del vano')
                ON CONFLICT (sensor_id) DO NOTHING
            """)
            logging.info("✓ Sensores inyectados")

            logging.info("✅ ¡Base de datos preparada y sembrada con éxito!")

        finally:
            await conn.close()
            
    except Exception as e:
        logging.error(f"❌ Falló la conexión a vigamonitor: {type(e).__name__} -> {e}")

if __name__ == "__main__":
    asyncio.run(seed())