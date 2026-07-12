import { useState, useEffect } from "react";
import { X, MapPin } from "lucide-react";
import { getNextSensorId, createSensor } from "../services/api";
import { SensorPositionPicker } from "./BridgeViewer3D";
import type { SensorType } from "../types/telemetry";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function AddSensorModal({ onClose, onCreated }: Props) {
  const [sensorId, setSensorId] = useState("");
  const [sensorTipo, setSensorTipo] = useState<SensorType>("distancia");
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [use3dPicker, setUse3dPicker] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<[number, number, number] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getNextSensorId()
      .then((r) => setSensorId(r.sensor_id))
      .catch(() => setSensorId("bridge-xx"));
  }, []);

  const handlePositionSelect = (x: number, y: number, z: number) => {
    const coords = `x: ${x.toFixed(2)}, y: ${y.toFixed(2)}, z: ${z.toFixed(2)}`;
    setUbicacion(coords);
    setSelectedPosition([x, y, z]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createSensor({
        sensor_id: sensorId,
        sensor_tipo: sensorTipo,
        nombre: nombre.trim(),
        ubicacion: ubicacion.trim(),
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al crear sensor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-900 rounded-xl border border-surface-800 w-full max-w-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Agregar Sensor</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-surface-400 mb-1">ID del Sensor</label>
            <input
              value={sensorId}
              onChange={(e) => setSensorId(e.target.value)}
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-primary-500"
              placeholder="bridge-03"
            />
            <p className="text-surface-500 text-xs mt-1">Auto-sugerido, puedes editarlo manualmente</p>
          </div>

          <div>
            <label className="block text-xs text-surface-400 mb-1">Tipo de Sensor</label>
            <select
              value={sensorTipo}
              onChange={(e) => setSensorTipo(e.target.value as SensorType)}
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            >
              <option value="distancia">Distancia (mm)</option>
              <option value="vibracion">Vibración (m/s²)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-surface-400 mb-1">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              placeholder="Sensor de Deflexion B"
            />
          </div>

          {/* Ubicacion: toggle + 3D picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-surface-400">Ubicacion</label>
              <button
                type="button"
                onClick={() => {
                  setUse3dPicker(!use3dPicker);
                  if (!use3dPicker) setSelectedPosition(null);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-lg transition-colors ${
                  use3dPicker
                    ? "text-primary-400 bg-primary-500/15"
                    : "text-surface-400 bg-surface-800 hover:text-surface-200"
                }`}
              >
                <MapPin size={12} />
                {use3dPicker ? "Vista 3D activa" : "Ubicar en 3D"}
              </button>
            </div>

            {use3dPicker ? (
              <div className="space-y-2">
                <SensorPositionPicker
                  glbUrl="/viga.glb"
                  selectedPosition={selectedPosition}
                  onPositionSelect={handlePositionSelect}
                />
                <input
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-primary-500"
                  placeholder="Coordenadas del click"
                  readOnly
                />
                <p className="text-surface-500 text-[10px]">
                  Haz click en el puente 3D para marcar la posicion. Tambien puedes editar el texto manualmente.
                </p>
              </div>
            ) : (
              <input
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                placeholder="Extremo norte del puente"
              />
            )}
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
              {loading ? "Creando..." : "Crear Sensor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
