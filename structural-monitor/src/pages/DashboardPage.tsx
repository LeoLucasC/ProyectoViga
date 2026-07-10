import { Ruler, Waves } from "lucide-react";
import { useTelemetry } from "../context/TelemetryContext";
import { KpiCard } from "../components/KpiCard";
import { StatusCard } from "../components/StatusCard";
import { RealtimeChart } from "../components/RealtimeChart";
import {
  DISTANCIA_ALERT_THRESHOLD,
  DISTANCIA_CRITICAL_THRESHOLD,
  VIBRACION_ALERT_THRESHOLD,
  VIBRACION_CRITICAL_THRESHOLD,
} from "../types/telemetry";

function kpiStatus(value: number | null, alert: number, critical: number) {
  if (value === null) return "normal" as const;
  if (value >= critical) return "critical" as const;
  if (value >= alert) return "alert" as const;
  return "normal" as const;
}

export function DashboardPage() {
  const {
    distanciaActual,
    vibracionActual,
    distanciaHistory,
    vibracionHistory,
    estructuraStatus,
  } = useTelemetry();

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KpiCard
          title="Distancia"
          value={distanciaActual?.toFixed(1) ?? "—"}
          unit="mm"
          icon={<Ruler size={20} />}
          status={kpiStatus(
            distanciaActual,
            DISTANCIA_ALERT_THRESHOLD,
            DISTANCIA_CRITICAL_THRESHOLD
          )}
        />
        <KpiCard
          title="Vibración"
          value={vibracionActual?.toFixed(2) ?? "—"}
          unit="m/s²"
          icon={<Waves size={20} />}
          status={kpiStatus(
            vibracionActual,
            VIBRACION_ALERT_THRESHOLD,
            VIBRACION_CRITICAL_THRESHOLD
          )}
        />
        <StatusCard status={estructuraStatus} />
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <RealtimeChart
          data={distanciaHistory}
          title="Deflexión de la Viga"
          unit="mm"
          color="#60a5fa"
          domain={[0, "auto" as unknown as number]}
        />
        <RealtimeChart
          data={vibracionHistory}
          title="Frecuencia Vibratoria"
          unit="m/s²"
          color="#34d399"
          type="area"
          domain={[0, "auto" as unknown as number]}
        />
      </section>

      {/* Bottom metadata */}
      <footer className="text-surface-500 text-[11px] text-right font-mono">
        Últimos {distanciaHistory.length ?? 0} puntos · Máx. 50 en pantalla
      </footer>
    </div>
  );
}
