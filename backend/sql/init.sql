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

-- 7. Time-series telemetry readings
CREATE TABLE IF NOT EXISTS telemetry_readings (
    time        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sensor_id   VARCHAR(100) NOT NULL,
    sensor_tipo VARCHAR(50) NOT NULL REFERENCES thresholds(sensor_tipo),
    valor       DOUBLE PRECISION NOT NULL,
    unidad      VARCHAR(20) NOT NULL,
    CONSTRAINT chk_unidad CHECK (
        (sensor_tipo = 'distancia' AND unidad = 'mm') OR
        (sensor_tipo = 'vibracion' AND unidad = 'm/s²')
    )
);

-- 8. Convert to hypertable (TimescaleDB)
SELECT create_hypertable('telemetry_readings', 'time', if_not_exists => TRUE);

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_readings_sensor_tipo_time
    ON telemetry_readings (sensor_tipo, time DESC);
CREATE INDEX IF NOT EXISTS idx_readings_sensor_id_time
    ON telemetry_readings (sensor_id, time DESC);

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
