import asyncio
import asyncpg
import logging
from app.config import settings

# Configurar los logs para ver el detalle de la conexión
logging.basicConfig(
    level=logging.DEBUG, 
    format='%(asctime)s - %(levelname)s - %(message)s'
)

async def seed() -> None:
    dsn = str(settings.database_dsn)
    
    # FASE 2: INYECTAR TABLAS Y DATOS (Fase 1 omitida porque Docker ya crea la BD)
    logging.info("📦 Conectando a la base de datos 'vigamonitor'...")
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
            
            await conn.execute("CREATE SCHEMA IF NOT EXISTS public")
            await conn.execute("SET search_path TO public")

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

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS vigas (
                    viga_id    SERIAL PRIMARY KEY,
                    nombre     VARCHAR(200) NOT NULL,
                    ubicacion  VARCHAR(200) NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            logging.info("✓ Tabla: vigas")

            await conn.execute("""
                ALTER TABLE telemetry_readings
                ADD COLUMN IF NOT EXISTS viga_id INTEGER REFERENCES vigas(viga_id)
            """)
            logging.info("✓ Columna viga_id + FK agregada")

            for col in ["ax", "ay", "az", "adx", "ady", "adz", "aver", "gx", "gy", "gz", "temp"]:
                await conn.execute(
                    f'ALTER TABLE telemetry_readings ADD COLUMN IF NOT EXISTS "{col}" DOUBLE PRECISION'
                )
            await conn.execute(
                'ALTER TABLE telemetry_readings ADD COLUMN IF NOT EXISTS "evento" INTEGER'
            )
            logging.info("✓ Columnas de vibración detallada agregadas")

            try:
                await conn.execute(
                    "SELECT create_hypertable('telemetry_readings', 'time', if_not_exists => TRUE)"
                )
                logging.info("✓ Convertida a hypertable")
            except Exception:
                logging.info("- Conversión a Hypertable omitida")

            logging.info("📊 Creando índices...")
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_readings_sensor_tipo_time
                    ON telemetry_readings (sensor_tipo, time DESC)
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_readings_sensor_id_time
                    ON telemetry_readings (sensor_id, time DESC)
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_readings_viga_id_time
                    ON telemetry_readings (viga_id, time DESC)
            """)
            logging.info("✓ Índices creados")

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

            await conn.execute("""
                INSERT INTO vigas (nombre, ubicacion)
                VALUES
                    ('Viga Principal Puente 1', 'Tramo central - Río Bravo'),
                    ('Viga Secundaria Acceso Norte', 'Acceso norte - Estribo A')
                ON CONFLICT (viga_id) DO NOTHING
            """)
            logging.info("✓ Vigas inyectadas")

            logging.info("✅ ¡Base de datos preparada y sembrada con éxito!")

        finally:
            await conn.close()
            
    except Exception as e:
        logging.error(f"❌ Falló la conexión a vigamonitor: {type(e).__name__} -> {e}")

if __name__ == "__main__":
    asyncio.run(seed())