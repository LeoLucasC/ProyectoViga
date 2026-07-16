-- ============================================================
-- Migration 002: Add VL53L1X distance sensor detailed columns
-- ============================================================

ALTER TABLE telemetry_readings
    ADD COLUMN IF NOT EXISTS distancia_raw             DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS distancia_corregida        DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS distancia_mediana_raw      DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS distancia_mediana_corregida DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS deflexion_raw              DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS deflexion_filtrada         DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS referencia_mm              DOUBLE PRECISION;
