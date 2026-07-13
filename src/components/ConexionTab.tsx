import { Wifi, Trash2 } from "lucide-react";
import { useTelemetry } from "../context/TelemetryContext";
import { resetTelemetry } from "../services/api";

export function ConexionTab() {
  const { connectionStatus, resetData } = useTelemetry();

  const handleReset = async () => {
    try {
      await resetTelemetry();
      resetData();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* WebSocket Info */}
      <section className="bg-surface-900/80 rounded-xl border border-surface-800 p-5 space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Wifi size={16} className="text-primary-400" />
          <span>Conexión WebSocket</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-surface-400 text-sm">Servidor</span>
          <code className="text-surface-200 text-sm font-mono bg-surface-800 px-3 py-1 rounded-md">
            ws://${window.location.host}/ws/telemetria
          </code>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-surface-400 text-sm">Estado</span>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              connectionStatus === "connected"
                ? "text-success-400 bg-success-400/10"
                : connectionStatus === "reconnecting"
                  ? "text-warning-400 bg-warning-400/10"
                  : "text-danger-400 bg-danger-400/10"
            }`}
          >
            {connectionStatus === "connected"
              ? "Conectado"
              : connectionStatus === "reconnecting"
                ? "Reconectando…"
                : "Desconectado"}
          </span>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-surface-900/80 rounded-xl border border-red-900/30 p-5 space-y-4">
        <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
          <Trash2 size={16} />
          <span>Zona de Peligro</span>
        </div>
        <p className="text-surface-400 text-xs">
          Elimina todos los datos de telemetría acumulados en la base de datos.
        </p>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
        >
          Reiniciar datos
        </button>
      </section>
    </div>
  );
}
