import { useEffect, useState, useCallback } from "react";
import { Ruler, Waves, Clock, Activity } from "lucide-react";
import { useTelemetry } from "../context/TelemetryContext";
import { KpiCard } from "../components/KpiCard";
import { StatusCard } from "../components/StatusCard";
import { RealtimeChart } from "../components/RealtimeChart";
import { BridgeViewer3D } from "../components/BridgeViewer3D";
import { Seismograph } from "../components/Seismograph";
import { getSensors } from "../services/api";
import type { SensorResponse, TelemetryPoint } from "../types/telemetry";
import {
  DISTANCIA_ALERT_THRESHOLD,
  DISTANCIA_CRITICAL_THRESHOLD,
  VIBRACION_ALERT_THRESHOLD,
  VIBRACION_CRITICAL_THRESHOLD,
  MAX_HISTORY_POINTS,
} from "../types/telemetry";

function kpiStatus(value: number | null, alert: number, critical: number) {
  if (value === null) return "normal" as const;
  if (value >= critical) return "critical" as const;
  if (value >= alert) return "alert" as const;
  return "normal" as const;
}

function computeProgress(value: number | null, critical: number): number | undefined {
  if (value === null) return undefined;
  return Math.min((value / critical) * 100, 100);
}

function computeTrend(history: { valor: number }[]): { trend: "up" | "down" | "stable"; value: string } | undefined {
  if (history.length < 2) return undefined;
  const last = history[history.length - 1].valor;
  const prev = history[history.length - 2].valor;
  const diff = last - prev;
  const absDiff = Math.abs(diff);
  if (absDiff < 0.01) return { trend: "stable", value: "Sin cambios" };
  if (diff > 0) return { trend: "up", value: `+${diff.toFixed(2)}` };
  return { trend: "down", value: `${diff.toFixed(2)}` };
}

function computeStats(history: TelemetryPoint[]) {
  if (history.length === 0) return { avg: 0, max: 0, min: 0, count: 0 };
  const values = history.map((p) => p.valor);
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    avg: sum / values.length,
    max: Math.max(...values),
    min: Math.min(...values),
    count: values.length,
  };
}

function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function DashboardPage() {
  const {
    distanciaActual,
    vibracionActual,
    vibracionIzquierdo,
    vibracionDerecho,
    distanciaHistory,
    vibracionHistory,
    vibracionIzquierdoHistory,
    vibracionDerechoHistory,
    estructuraStatus,
  } = useTelemetry();

  const [sensors, setSensors] = useState<SensorResponse[]>([]);

  const fetchSensors = useCallback(async () => {
    try {
      const data = await getSensors();
      setSensors(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(fetchSensors, 5000);
    return () => clearInterval(interval);
  }, [fetchSensors]);

  const distTrend = computeTrend(distanciaHistory);
  const vibTrend = computeTrend(vibracionHistory);
  const distStats = computeStats(distanciaHistory);
  const vibStats = computeStats(vibracionHistory);
  const vibIzquierdoStats = computeStats(vibracionIzquierdoHistory);
  const vibDerechoStats = computeStats(vibracionDerechoHistory);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold tracking-tight">Panel de Monitoreo</h2>
          <p className="text-surface-400 text-sm mt-0.5">
            {distanciaHistory.length + vibracionHistory.length} lecturas en esta sesión
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-900 border border-surface-800 text-surface-400 text-xs font-mono">
          <Clock size={14} />
          <span suppressHydrationCheck>{formatTime()}</span>
        </div>
      </div>

      {/* ── Fila 1: Sismógrafos Izquierdo / Derecho + Estado ── */}
      <section className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-2">
          <Seismograph
            series={[
              { data: vibracionIzquierdoHistory, color: "#22c55e", label: "Izquierdo" },
            ]}
            avg={vibIzquierdoStats.avg}
            max={vibIzquierdoStats.max}
            min={vibIzquierdoStats.min}
          />
        </div>
        <div className="xl:col-span-1 space-y-5">
          <StatusCard status={estructuraStatus} readings={distanciaHistory.length + vibracionHistory.length} />
        </div>
        <div className="xl:col-span-2">
          <Seismograph
            series={[
              { data: vibracionDerechoHistory, color: "#22d3ee", label: "Derecho" },
            ]}
            avg={vibDerechoStats.avg}
            max={vibDerechoStats.max}
            min={vibDerechoStats.min}
          />
        </div>
      </section>

      {/* ── Fila 2: KPIs en grid de 4 ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          title="Deflexión de Viga"
          value={distanciaActual?.toFixed(1) ?? "—"}
          unit="mm"
          icon={<Ruler size={20} />}
          status={kpiStatus(distanciaActual, DISTANCIA_ALERT_THRESHOLD, DISTANCIA_CRITICAL_THRESHOLD)}
          progress={computeProgress(distanciaActual, DISTANCIA_CRITICAL_THRESHOLD)}
          trend={distTrend?.trend}
          trendValue={distTrend?.value}
          stats={{ avg: distStats.avg, max: distStats.max, min: distStats.min }}
        />
        <KpiCard
          title="Vibración Izquierdo"
          value={vibracionIzquierdo?.toFixed(3) ?? "—"}
          unit="m/s²"
          icon={<Waves size={20} />}
          status={kpiStatus(vibracionIzquierdo, VIBRACION_ALERT_THRESHOLD, VIBRACION_CRITICAL_THRESHOLD)}
          progress={computeProgress(vibracionIzquierdo, VIBRACION_CRITICAL_THRESHOLD)}
          stats={{ avg: vibIzquierdoStats.avg, max: vibIzquierdoStats.max, min: vibIzquierdoStats.min }}
        />
        <KpiCard
          title="Vibración Derecho"
          value={vibracionDerecho?.toFixed(3) ?? "—"}
          unit="m/s²"
          icon={<Waves size={20} />}
          status={kpiStatus(vibracionDerecho, VIBRACION_ALERT_THRESHOLD, VIBRACION_CRITICAL_THRESHOLD)}
          progress={computeProgress(vibracionDerecho, VIBRACION_CRITICAL_THRESHOLD)}
          stats={{ avg: vibDerechoStats.avg, max: vibDerechoStats.max, min: vibDerechoStats.min }}
        />
        {/* Últimas lecturas en una mini tabla */}
        <div className="bg-surface-900/80 backdrop-blur-sm rounded-xl border border-surface-800 p-5">
          <div className="flex items-center gap-2 text-white font-semibold text-sm mb-3">
            <Activity size={16} className="text-primary-400" />
            <span>Últimas Lecturas</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-surface-800">
              <span className="text-surface-400">Deflexión</span>
              <span className="text-surface-200 tabular-nums">{distanciaActual !== null ? `${distanciaActual.toFixed(1)} mm` : "—"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-surface-800">
              <span className="text-surface-400">Vib. Izquierdo</span>
              <span className="text-surface-200 tabular-nums">{vibracionIzquierdo !== null ? `${vibracionIzquierdo.toFixed(3)} m/s²` : "—"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-surface-800">
              <span className="text-surface-400">Vib. Derecho</span>
              <span className="text-surface-200 tabular-nums">{vibracionDerecho !== null ? `${vibracionDerecho.toFixed(3)} m/s²` : "—"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-surface-800">
              <span className="text-surface-400">Prom. Deflexión</span>
              <span className="text-surface-200 tabular-nums">{distStats.avg.toFixed(1)} mm</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-surface-800">
              <span className="text-surface-400">Prom. Vibración</span>
              <span className="text-surface-200 tabular-nums">{vibStats.avg.toFixed(3)} m/s²</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-surface-400">Estado</span>
              <span className={`tabular-nums font-medium ${
                estructuraStatus === "stable" ? "text-success-400" :
                estructuraStatus === "alert" ? "text-warning-400" : "text-danger-400"
              }`}>
                {estructuraStatus === "stable" ? "Estable" :
                 estructuraStatus === "alert" ? "Alerta" : "Crítico"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fila 3: Gráfico Deflexión + Visor 3D ── */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <RealtimeChart
            data={distanciaHistory}
            title="Deflexión de la Viga"
            unit="mm"
            color="#60a5fa"
            domain={["auto" as unknown as number, "auto" as unknown as number]}
            stats={{ avg: distStats.avg, max: distStats.max, min: distStats.min }}
          />
        </div>
        <div className="xl:col-span-1">
          <BridgeViewer3D glbUrl="/viga.glb" sensors={sensors} />
        </div>
      </section>
    </div>
  );
}
