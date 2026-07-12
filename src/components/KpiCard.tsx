import type { ReactNode } from "react";
import { AlertTriangle, TriangleAlert, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | ReactNode;
  unit: string;
  icon: ReactNode;
  status?: "normal" | "alert" | "critical";
  progress?: number;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  stats?: { avg: number; max: number; min: number };
}

const statusStyles = {
  normal: {
    border: "border-l-primary-400",
    glow: "shadow-primary-400/10",
    bar: "bg-gradient-to-r from-primary-400 to-primary-500",
    iconBg: "bg-primary-400/10 text-primary-400",
    ring: "ring-primary-400/20",
  },
  alert: {
    border: "border-l-warning-400",
    glow: "shadow-warning-400/10",
    bar: "bg-gradient-to-r from-warning-400 to-warning-500",
    iconBg: "bg-warning-400/10 text-warning-400",
    ring: "ring-warning-400/20",
  },
  critical: {
    border: "border-l-danger-400",
    glow: "shadow-danger-400/10",
    bar: "bg-gradient-to-r from-danger-400 to-danger-500",
    iconBg: "bg-danger-400/10 text-danger-400",
    ring: "ring-danger-400/20",
  },
};

export function KpiCard({
  title,
  value,
  unit,
  icon,
  status = "normal",
  progress,
  trend,
  trendValue,
  stats,
}: KpiCardProps) {
  const s = statusStyles[status];

  const TrendIcon =
    trend === "up"
      ? TrendingUp
      : trend === "down"
        ? TrendingDown
        : null;

  return (
    <div
      className={`group relative bg-surface-900/80 backdrop-blur-sm rounded-xl border border-surface-800 border-l-4 ${s.border} p-5 transition-all duration-300 hover:border-surface-700 hover:shadow-lg ${s.glow} overflow-hidden`}
    >
      {/* Barra de progreso superior animada */}
      {progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-800">
          <div
            className={`h-full ${s.bar} transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-surface-400 text-[11px] font-semibold uppercase tracking-[0.12em]">
          {title}
        </span>
        <span className={`p-2.5 rounded-xl ${s.iconBg} transition-all duration-300 group-hover:scale-110 ${s.ring} ring-1`}>
          {icon}
        </span>
      </div>

      {/* Valor principal */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-white text-4xl font-bold tracking-tight tabular-nums">
          {value ?? "—"}
        </span>
        <span className="text-surface-400 text-sm font-medium">{unit}</span>
      </div>

      {/* Trend */}
      {TrendIcon && trendValue && (
        <div className="flex items-center gap-1.5 mt-1">
          <TrendIcon
            size={14}
            className={
              trend === "up"
                ? "text-danger-400"
                : trend === "down"
                  ? "text-success-400"
                  : "text-surface-400"
            }
          />
          <span
            className={
              trend === "up"
                ? "text-danger-400"
                : trend === "down"
                  ? "text-success-400"
                  : "text-surface-400"
            }
          >
            {trendValue}
          </span>
        </div>
      )}

      {/* Status alerts */}
      {status === "alert" && (
        <div className="flex items-center gap-1.5 mt-3 text-warning-400 text-xs font-medium">
          <AlertTriangle size={14} />
          <span>Valor elevado — monitorear</span>
        </div>
      )}
      {status === "critical" && (
        <div className="flex items-center gap-1.5 mt-3 text-danger-400 text-xs font-medium">
          <TriangleAlert size={14} />
          <span>Límite crítico excedido</span>
        </div>
      )}

      {/* Estadísticas: promedio, máx, mín */}
      {stats && (
        <div className="mt-3 pt-3 border-t border-surface-800 flex items-center gap-4 text-[10px] font-mono">
          <span className="text-surface-500">Prom <span className="text-surface-300">{stats.avg.toFixed(1)}</span></span>
          <span className="text-surface-500">Máx <span className="text-danger-400">{stats.max.toFixed(1)}</span></span>
          <span className="text-surface-500">Mín <span className="text-primary-400">{stats.min.toFixed(1)}</span></span>
        </div>
      )}
    </div>
  );
}
