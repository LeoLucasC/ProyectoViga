import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import type { ConnectionStatus } from "../types/telemetry";

function statusConfig(status: ConnectionStatus) {
  switch (status) {
    case "connected":
      return {
        Icon: Wifi,
        label: "Conectado",
        className: "text-success-400 bg-success-400/10 border-success-400/20",
      };
    case "reconnecting":
      return {
        Icon: RefreshCw,
        label: "Reconectando…",
        className: "text-warning-400 bg-warning-400/10 border-warning-400/20",
      };
    case "disconnected":
      return {
        Icon: WifiOff,
        label: "Desconectado",
        className: "text-danger-400 bg-danger-400/10 border-danger-400/20",
      };
  }
}

export function Header({
  connectionStatus,
}: {
  connectionStatus: ConnectionStatus;
}) {
  const { Icon, label, className } = statusConfig(connectionStatus);

  return (
    <header className="h-16 bg-surface-900/80 backdrop-blur-md border-b border-surface-800 px-6 flex items-center justify-between shrink-0">
      <h2 className="text-white font-semibold text-lg">Dashboard</h2>

      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-300 ${className}`}
      >
        <Icon
          size={16}
          className={
            connectionStatus === "reconnecting" ? "animate-spin" : undefined
          }
        />
        <span className="text-xs">{label}</span>
      </div>
    </header>
  );
}
