import { useState } from "react";
import { Pencil, Power, PowerOff, Activity, Trash2 } from "lucide-react";
import type { SensorResponse } from "../types/telemetry";

interface Props {
  sensor: SensorResponse;
  onToggle: (id: string) => void;
  onEdit: (sensor: SensorResponse) => void;
  onDelete: (id: string) => void;
}

function formatTimeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5) return "ahora";
  if (secs < 60) return `hace ${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `hace ${mins}min`;
  return `hace ${Math.floor(mins / 60)}h`;
}

function statusColors(s: SensorResponse) {
  if (!s.online) return { dot: "bg-surface-500", text: "text-surface-400", label: "Offline" };
  if (s.reading_status === "critical") return { dot: "bg-danger-500 animate-pulse", text: "text-danger-400", label: "Crítico" };
  if (s.reading_status === "alert") return { dot: "bg-warning-400 animate-pulse", text: "text-warning-400", label: "Alerta" };
  return { dot: "bg-success-400 animate-pulse", text: "text-success-400", label: "Normal" };
}

const tipoBadge: Record<string, { bg: string; text: string }> = {
  distancia: { bg: "bg-primary-500/15", text: "text-primary-400" },
  vibracion: { bg: "bg-success-500/15", text: "text-success-400" },
};

export function SensorCard({ sensor, onToggle, onEdit, onDelete }: Props) {
  const colors = statusColors(sensor);
  const badge = tipoBadge[sensor.sensor_tipo] ?? tipoBadge.distancia;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(sensor.sensor_id);
    setConfirmDelete(false);
  };

  return (
    <div className="bg-surface-900/80 backdrop-blur-sm rounded-xl border border-surface-800 p-5 hover:border-surface-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${colors.dot} shadow-lg shadow-current/20`} />
          <div>
            <h3 className="text-white font-semibold text-sm">{sensor.nombre || sensor.sensor_id}</h3>
            <span className="text-surface-500 text-xs font-mono">{sensor.sensor_id}</span>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
          {sensor.sensor_tipo}
        </span>
      </div>

      <p className="text-surface-400 text-xs mb-2">
        <Activity size={12} className="inline mr-1" />
        {sensor.ubicacion || "Sin ubicación"}
      </p>

      <div className="border-t border-surface-800 pt-3 mt-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-surface-500">Última lectura</span>
          <span className="text-surface-300 font-mono">
            {sensor.latest_valor !== null && sensor.latest_valor !== undefined
              ? `${sensor.latest_valor} ${sensor.latest_unidad ?? ""}`
              : "—"}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-surface-500">Estado</span>
          <span className={colors.text}>{colors.label}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-surface-500">Último visto</span>
          <span className="text-surface-400">{formatTimeAgo(sensor.latest_time)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-800">
        <button
          onClick={() => onEdit(sensor)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-300 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-lg transition-colors"
        >
          <Pencil size={12} />
          Editar
        </button>
        <button
          onClick={handleDelete}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            confirmDelete
              ? "text-white bg-danger-500 animate-pulse"
              : "text-danger-400 bg-danger-500/10 hover:bg-danger-500/20"
          }`}
        >
          <Trash2 size={12} />
          {confirmDelete ? "¿Seguro?" : "Eliminar"}
        </button>
        <button
          onClick={() => onToggle(sensor.sensor_id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ml-auto ${
            sensor.activo
              ? "text-success-400 bg-success-400/10 hover:bg-success-400/20"
              : "text-surface-400 bg-surface-800 hover:bg-surface-700"
          }`}
        >
          {sensor.activo ? <Power size={12} /> : <PowerOff size={12} />}
          {sensor.activo ? "Activo" : "Inactivo"}
        </button>
      </div>
    </div>
  );
}
