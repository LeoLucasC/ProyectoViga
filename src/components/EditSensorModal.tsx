import { useState } from "react";
import { X } from "lucide-react";
import { updateSensor } from "../services/api";
import type { SensorResponse } from "../types/telemetry";

interface Props {
  sensor: SensorResponse;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditSensorModal({ sensor, onClose, onUpdated }: Props) {
  const [nombre, setNombre] = useState(sensor.nombre || "");
  const [ubicacion, setUbicacion] = useState(sensor.ubicacion || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await updateSensor(sensor.sensor_id, { nombre: nombre.trim(), ubicacion: ubicacion.trim() });
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al actualizar sensor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-900 rounded-xl border border-surface-800 w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Editar Sensor</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-surface-800 rounded-lg">
          <div className="text-xs text-surface-400">ID</div>
          <div className="text-sm text-white font-mono">{sensor.sensor_id}</div>
          <div className="text-xs text-surface-400 mt-1">Tipo</div>
          <div className="text-sm text-white">{sensor.sensor_tipo}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-surface-400 mb-1">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs text-surface-400 mb-1">Ubicación</label>
            <input
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          {error && <p className="text-danger-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-surface-300 bg-surface-800 hover:bg-surface-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 rounded-lg transition-colors"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
