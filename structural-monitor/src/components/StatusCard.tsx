import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import type { EstructuraStatus } from "../types/telemetry";

const cfg: Record<
  EstructuraStatus,
  {
    icon: typeof ShieldCheck;
    label: string;
    desc: string;
    border: string;
    bg: string;
    iconBg: string;
  }
> = {
  stable: {
    icon: ShieldCheck,
    label: "Estable",
    desc: "Dentro de parámetros normales",
    border: "border-l-success-400",
    bg: "bg-success-400/5",
    iconBg: "bg-success-400/10 text-success-400",
  },
  alert: {
    icon: ShieldAlert,
    label: "Alerta",
    desc: "Valores elevados detectados",
    border: "border-l-warning-400",
    bg: "bg-warning-400/5",
    iconBg: "bg-warning-400/10 text-warning-400",
  },
  critical: {
    icon: ShieldX,
    label: "Crítico",
    desc: "Se requieren acciones inmediatas",
    border: "border-l-danger-400",
    bg: "bg-danger-400/5",
    iconBg: "bg-danger-400/10 text-danger-400",
  },
};

export function StatusCard({
  status,
}: {
  status: EstructuraStatus;
}) {
  const { icon: Icon, label, desc, border, iconBg } = cfg[status];

  return (
    <div
      className={`bg-surface-900 rounded-xl border border-surface-800 border-l-4 ${border} p-5 transition-all duration-300`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-surface-400 text-xs font-medium uppercase tracking-wider">
          Estado Estructural
        </span>
        <span className={`p-2 rounded-lg ${iconBg}`}>
          <Icon size={20} />
        </span>
      </div>
      <span className="text-white text-3xl font-bold tracking-tight block mb-1">
        {label}
      </span>
      <span className="text-surface-400 text-sm">{desc}</span>
    </div>
  );
}
