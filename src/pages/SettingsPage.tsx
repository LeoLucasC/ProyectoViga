import { Settings, Wifi, Bell, Trash2 } from "lucide-react";
import { useTelemetry } from "../context/TelemetryContext";

export function SettingsPage() {
  const { connectionStatus, resetData } = useTelemetry();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Settings size={18} className="text-surface-400" />
        <h2 className="text-white font-semibold text-lg">Configuración</h2>
      </div>

      {/* Connection Config */}
      <section className="bg-surface-900 rounded-xl border border-surface-800 p-5 space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Wifi size={16} className="text-primary-400" />
          <span>Conexión WebSocket</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-surface-400 text-sm">Servidor</span>
          <code className="text-surface-200 text-sm font-mono bg-surface-800 px-3 py-1 rounded-md">
            ws://localhost:8000/ws/telemetria
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

      {/* Thresholds */}
      <section className="bg-surface-900 rounded-xl border border-surface-800 p-5 space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Bell size={16} className="text-warning-400" />
          <span>Umbrales de Alerta</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-surface-400 text-sm">Distancia mm (Alerta)</span>
            <code className="text-surface-200 text-sm font-mono">&gt; 40 mm</code>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-surface-400 text-sm">
              Distancia mm (Crítico)
            </span>
            <code className="text-danger-400 text-sm font-mono">&gt; 60 mm</code>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-surface-400 text-sm">
              Vibración m/s² (Alerta)
            </span>
            <code className="text-surface-200 text-sm font-mono">&gt; 0.8 m/s²</code>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-surface-400 text-sm">
              Vibración m/s² (Crítico)
            </span>
            <code className="text-danger-400 text-sm font-mono">&gt; 1.5 m/s²</code>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-surface-900 rounded-xl border border-red-900/30 p-5 space-y-4">
        <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
          <Trash2 size={16} />
          <span>Zona de Peligro</span>
        </div>
        <p className="text-surface-400 text-xs">
          Reinicia todos los datos de telemetría acumulados en la sesión.
        </p>
        <button
          onClick={resetData}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
        >
          Reiniciar datos
        </button>
      </section>
    </div>
  );
}
