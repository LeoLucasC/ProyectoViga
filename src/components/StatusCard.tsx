import { ShieldCheck, ShieldAlert, ShieldX, Activity } from "lucide-react";
import type { EstructuraStatus } from "../types/telemetry";

const cfg: Record<
  EstructuraStatus,
  {
    icon: typeof ShieldCheck;
    label: string;
    desc: string;
    border: string;
    glow: string;
    badge: string;
    gradient: string;
  }
> = {
  stable: {
    icon: ShieldCheck,
    label: "Estable",
    desc: "Dentro de parámetros normales",
    border: "border-l-success-400",
    glow: "shadow-success-400/10",
    badge: "bg-success-400/10 text-success-400 ring-success-400/20",
    gradient: "from-success-400 to-emerald-500",
  },
  alert: {
    icon: ShieldAlert,
    label: "Alerta",
    desc: "Valores elevados detectados",
    border: "border-l-warning-400",
    glow: "shadow-warning-400/10",
    badge: "bg-warning-400/10 text-warning-400 ring-warning-400/20",
    gradient: "from-warning-400 to-amber-500",
  },
  critical: {
    icon: ShieldX,
    label: "Crítico",
    desc: "Se requieren acciones inmediatas",
    border: "border-l-danger-400",
    glow: "shadow-danger-400/10",
    badge: "bg-danger-400/10 text-danger-400 ring-danger-400/20",
    gradient: "from-danger-400 to-rose-500",
  },
};

interface StatusCardProps {
  status: EstructuraStatus;
  readings?: number;
}

export function StatusCard({ status, readings }: StatusCardProps) {
  const { icon: Icon, label, desc, border, glow, badge, gradient } = cfg[status];

  return (
    <div
      className={`group relative bg-surface-900/80 backdrop-blur-sm rounded-xl border border-surface-800 border-l-4 ${border} p-5 transition-all duration-300 hover:shadow-lg ${glow} overflow-hidden`}
    >
      {/* Gradient accent line */}
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${gradient} opacity-[0.04] rounded-bl-full pointer-events-none`}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-surface-400 text-[11px] font-semibold uppercase tracking-[0.12em]">
          Estado Estructural
        </span>
        <span
          className={`p-2.5 rounded-xl ${badge} ring-1 transition-all duration-300 group-hover:scale-110`}
        >
          <Icon size={20} />
        </span>
      </div>

      {/* Status value */}
      <span className="text-white text-4xl font-bold tracking-tight block mb-1">
        {label}
      </span>
      <span className="text-surface-400 text-sm">{desc}</span>

      {/* Live indicator + stats */}
      <div className="mt-4 pt-3 border-t border-surface-800 space-y-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status === "stable"
                  ? "bg-success-400"
                  : status === "alert"
                    ? "bg-warning-400"
                    : "bg-danger-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                status === "stable"
                  ? "bg-success-400"
                  : status === "alert"
                    ? "bg-warning-400"
                    : "bg-danger-400"
              }`}
            />
          </span>
          <span className="text-surface-500 text-xs">Monitoreo en tiempo real</span>
          <Activity size={12} className="text-surface-600 ml-auto" />
        </div>
        {readings !== undefined && (
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-surface-500">Lecturas registradas</span>
            <span className="text-surface-300 tabular-nums">{readings}</span>
          </div>
        )}
      </div>
    </div>
  );
}
