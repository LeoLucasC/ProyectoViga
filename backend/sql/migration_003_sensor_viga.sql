-- ============================================================
-- Migration 003: Assign sensors to a specific viga
-- Adds viga_id FK to sensors table so each sensor knows
-- which beam it belongs to. Telemetry readings inherit
-- the viga_id from the sensor automatically.
-- ============================================================

ALTER TABLE sensors
ADD COLUMN IF NOT EXISTS viga_id INTEGER REFERENCES vigas(viga_id);

CREATE INDEX IF NOT EXISTS idx_sensors_viga_id
    ON sensors (viga_id);

-- Assign existing sensors to the first viga (backwards compat)
UPDATE sensors SET viga_id = (SELECT viga_id FROM vigas ORDER BY viga_id LIMIT 1)
WHERE viga_id IS NULL;
