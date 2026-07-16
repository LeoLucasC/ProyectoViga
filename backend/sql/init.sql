-- ============================================================
-- VigaMonitor - Database Initialization
-- Digital Twin - Structural Telemetry
-- ============================================================

-- 1. Fix search_path (run once as superuser)
-- ALTER ROLE postgres SET search_path TO '"$user", public';

-- 2. Create database (run as superuser)
-- CREATE DATABASE vigamonitor;

-- 3. Connect to vigamonitor database, then run below

-- 4. Extensions
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 5. Configuration tables
CREATE TABLE IF NOT EXISTS thresholds (
    sensor_tipo    VARCHAR(50) PRIMARY KEY,
    alert_valor    DOUBLE PRECISION NOT NULL,
    critical_valor DOUBLE PRECISION NOT NULL,
    updated_at     TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_thresholds CHECK (alert_valor < critical_valor)
);

-- 6. Sensors registry
CREATE TABLE IF NOT EXISTS sensors (
    sensor_id   VARCHAR(100) PRIMARY KEY,
    sensor_tipo VARCHAR(50) NOT NULL REFERENCES thresholds(sensor_tipo),
    nombre      VARCHAR(200),
    ubicacion   VARCHAR(200),
    activo      BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Vigas registry (beams)
CREATE TABLE IF NOT EXISTS vigas (
    viga_id    SERIAL PRIMARY KEY,
    nombre     VARCHAR(200) NOT NULL,
    ubicacion  VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Users table
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(100) UNIQUE NOT NULL,
    email       VARCHAR(200) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Time-series telemetry readings
CREATE TABLE IF NOT EXISTS telemetry_readings (
    time        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sensor_id   VARCHAR(100) NOT NULL REFERENCES sensors(sensor_id),
    sensor_tipo VARCHAR(50) NOT NULL REFERENCES thresholds(sensor_tipo),
    valor       DOUBLE PRECISION NOT NULL,
    unidad      VARCHAR(20) NOT NULL,
    viga_id     INTEGER REFERENCES vigas(viga_id),
    distancia_raw               DOUBLE PRECISION,
    distancia_corregida         DOUBLE PRECISION,
    distancia_mediana_raw       DOUBLE PRECISION,
    distancia_mediana_corregida DOUBLE PRECISION,
    deflexion_raw               DOUBLE PRECISION,
    deflexion_filtrada          DOUBLE PRECISION,
    referencia_mm               DOUBLE PRECISION,
    ax          DOUBLE PRECISION,
    ay          DOUBLE PRECISION,
    az          DOUBLE PRECISION,
    adx         DOUBLE PRECISION,
    ady         DOUBLE PRECISION,
    adz         DOUBLE PRECISION,
    aver        DOUBLE PRECISION,
    gx          DOUBLE PRECISION,
    gy          DOUBLE PRECISION,
    gz          DOUBLE PRECISION,
    temp        DOUBLE PRECISION,
    evento      INTEGER,
    CONSTRAINT chk_unidad CHECK (
        (sensor_tipo = 'distancia' AND unidad = 'mm') OR
        (sensor_tipo = 'vibracion' AND unidad = 'm/s²')
    )
);

-- 10. Convert to hypertable (TimescaleDB)
SELECT create_hypertable('telemetry_readings', 'time', if_not_exists => TRUE);

-- 11. Indexes
CREATE INDEX IF NOT EXISTS idx_readings_sensor_tipo_time
    ON telemetry_readings (sensor_tipo, time DESC);
CREATE INDEX IF NOT EXISTS idx_readings_sensor_id_time
    ON telemetry_readings (sensor_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_readings_viga_id_time
    ON telemetry_readings (viga_id, time DESC);

-- ============================================================
-- Seed data
-- ============================================================

INSERT INTO thresholds (sensor_tipo, alert_valor, critical_valor)
VALUES
    ('distancia', 40.0, 60.0),
    ('vibracion', 0.8, 1.5)
ON CONFLICT (sensor_tipo) DO NOTHING;

INSERT INTO sensors (sensor_id, sensor_tipo, nombre, ubicacion)
VALUES
    ('bridge-01', 'distancia', 'Sensor de Deflexión A', 'Centro del vano'),
    ('bridge-02', 'vibracion', 'Sensor de Vibración B', 'Cuarto del vano')
ON CONFLICT (sensor_id) DO NOTHING;

INSERT INTO vigas (nombre, ubicacion)
VALUES
    ('Viga Principal Puente 1', 'Tramo central - Río Bravo'),
    ('Viga Secundaria Acceso Norte', 'Acceso norte - Estribo A')
ON CONFLICT (viga_id) DO NOTHING;
