import type { ReactNode } from "react";
import { AlertTriangle, TriangleAlert, TrendingUp } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | ReactNode;
  unit: string;
  icon: ReactNode;
  status?: "normal" | "alert" | "critical";
  trend?: "up" | "down" | "stable";
}

function statusBorder(status?: "normal" | "alert" | "critical") {
  switch (status) {
    case "alert":
      return "border-l-warning-400";
    case "critical":
      return "border-l-danger-400";
    default:
      return "border-l-primary-400";
  }
}

export function KpiCard({
  title,
  value,
  unit,
  icon,
  status = "normal",
  trend,
}: KpiCardProps) {
  const TrendIcon =
    trend === "up"
      ? TrendingUp
      : trend === "down"
        ? TrendingUp
        : null;

  return (
    <div
      className={`bg-surface-900 rounded-xl border border-surface-800 border-l-4 ${statusBorder(
        status
      )} p-5 transition-all duration-300 hover:border-surface-700`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-surface-400 text-xs font-medium uppercase tracking-wider">
          {title}
        </span>
        <span
          className={`p-2 rounded-lg ${
            status === "critical"
              ? "bg-danger-400/10 text-danger-400"
              : status === "alert"
                ? "bg-warning-400/10 text-warning-400"
                : "bg-primary-400/10 text-primary-400"
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-white text-3xl font-bold tracking-tight">
          {value ?? "—"}
        </span>
        <span className="text-surface-400 text-sm font-medium">{unit}</span>
      </div>
      {status === "alert" && (
        <div className="flex items-center gap-1.5 mt-2 text-warning-400 text-xs">
          <AlertTriangle size={14} />
          <span>Valor elevado — monitorear</span>
        </div>
      )}
      {status === "critical" && (
        <div className="flex items-center gap-1.5 mt-2 text-danger-400 text-xs">
          <TriangleAlert size={14} />
          <span>Límite crítico excedido</span>
        </div>
      )}
    </div>
  );
}
