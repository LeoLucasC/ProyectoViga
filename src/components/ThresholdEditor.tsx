import { useState, useEffect, useCallback } from "react";
import { Save } from "lucide-react";
import { getThresholds, updateThreshold } from "../services/api";
import { useTelemetry } from "../context/TelemetryContext";
import type { Threshold } from "../types/telemetry";

interface EditableThreshold {
  sensor_tipo: string;
  alert_valor: string;
  critical_valor: string;
}

const labels: Record<string, { name: string; unit: string }> = {
  distancia: { name: "Distancia", unit: "mm" },
  vibracion: { name: "Vibración", unit: "m/s²" },
};

export function ThresholdEditor() {
  const { refreshThresholds } = useTelemetry();
  const [items, setItems] = useState<EditableThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchThresholds = useCallback(async () => {
    try {
      const data = await getThresholds();
      setItems(
        data.map((t: Threshold) => ({
          sensor_tipo: t.sensor_tipo,
          alert_valor: String(t.alert_valor),
          critical_valor: String(t.critical_valor),
        }))
      );
    } catch {
      setError("Error al cargar umbrales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  const handleSave = async (sensorTipo: string) => {
    const item = items.find((i) => i.sensor_tipo === sensorTipo);
    if (!item) return;

    const alert = parseFloat(item.alert_valor);
    const critical = parseFloat(item.critical_valor);

    if (isNaN(alert) || isNaN(critical)) {
      setError("Valores inválidos");
      return;
    }
    if (critical <= alert) {
      setError("El valor crítico debe ser mayor que el de alerta");
      return;
    }

    setSaving(sensorTipo);
    setError("");
    try {
      await updateThreshold({ sensor_tipo: sensorTipo, alert_valor: alert, critical_valor: critical });
      refreshThresholds();
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(null);
    }
  };

  const update = (sensorTipo: string, field: "alert_valor" | "critical_valor", value: string) => {
    setItems((prev) =>
      prev.map((i) => (i.sensor_tipo === sensorTipo ? { ...i, [field]: value } : i))
    );
  };

  if (loading) {
    return <p className="text-surface-400 text-sm">Cargando umbrales...</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-danger-500/10 border border-danger-500/30 rounded-lg px-4 py-2 text-danger-400 text-xs">
          {error}
        </div>
      )}

      {items.map((item) => {
        const l = labels[item.sensor_tipo] ?? { name: item.sensor_tipo, unit: "" };
        return (
          <div
            key={item.sensor_tipo}
            className="bg-surface-900/80 rounded-xl border border-surface-800 p-5"
          >
            <h4 className="text-white font-semibold text-sm mb-4">{l.name}</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-surface-400 mb-1">
                  Alerta ({l.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={item.alert_valor}
                  onChange={(e) => update(item.sensor_tipo, "alert_valor", e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-warning-400"
                />
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">
                  Crítico ({l.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={item.critical_valor}
                  onChange={(e) => update(item.sensor_tipo, "critical_valor", e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-danger-500"
                />
              </div>
            </div>
            <button
              onClick={() => handleSave(item.sensor_tipo)}
              disabled={saving === item.sensor_tipo}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 rounded-lg transition-colors"
            >
              <Save size={14} />
              {saving === item.sensor_tipo ? "Guardando..." : "Guardar"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
