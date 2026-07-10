import { Clock, Ruler, Waves } from "lucide-react";
import { useTelemetry } from "../context/TelemetryContext";

export function HistorialPage() {
  const { distanciaHistory, vibracionHistory } = useTelemetry();

  // Merge and sort all points by timestamp
  const allPoints = [
    ...distanciaHistory.map((p) => ({ ...p, tipo: "distancia" as const })),
    ...vibracionHistory.map((p) => ({ ...p, tipo: "vibracion" as const })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock size={18} className="text-surface-400" />
        <h2 className="text-white font-semibold text-lg">
          Historial de Telemetría
        </h2>
      </div>

      {allPoints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-surface-500">
          <Clock size={40} className="mb-3 opacity-50" />
          <p className="text-sm">Esperando datos del WebSocket…</p>
        </div>
      ) : (
        <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800 text-surface-400 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Hora</th>
                <th className="text-left px-5 py-3 font-medium">Sensor</th>
                <th className="text-right px-5 py-3 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {allPoints.map((point, i) => (
                <tr
                  key={`${point.timestamp}-${i}`}
                  className="border-b border-surface-800/50 last:border-0 hover:bg-surface-800/30 transition-colors"
                >
                  <td className="px-5 py-2.5 font-mono text-surface-300">
                    {new Date(point.timestamp).toLocaleString("es-ES")}
                  </td>
                  <td className="px-5 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        point.tipo === "distancia"
                          ? "bg-primary-400/10 text-primary-400"
                          : "bg-success-400/10 text-success-400"
                      }`}
                    >
                      {point.tipo === "distancia" ? (
                        <Ruler size={12} />
                      ) : (
                        <Waves size={12} />
                      )}
                      {point.tipo === "distancia" ? "Distancia" : "Vibración"}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-surface-200 font-medium">
                    {point.valor.toFixed(2)}
                    <span className="text-surface-500 ml-1">
                      {point.tipo === "distancia" ? "mm" : "m/s²"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
