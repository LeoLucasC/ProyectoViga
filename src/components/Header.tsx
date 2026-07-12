import { type ReactNode } from "react";
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
  children,
}: {
  connectionStatus: ConnectionStatus;
  children?: ReactNode;
}) {
  const { Icon, label, className } = statusConfig(connectionStatus);

  return (
    <header className="h-16 bg-surface-900/80 backdrop-blur-md border-b border-surface-800 px-4 lg:px-6 flex items-center justify-between shrink-0 gap-3">
      <div className="flex items-center gap-3">
        {children}
        <h2 className="text-white font-semibold text-lg">VigaMonitor</h2>
      </div>

      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-300 ${className} shrink-0`}
      >
        <Icon
          size={16}
          className={
            connectionStatus === "reconnecting" ? "animate-spin" : undefined
          }
        />
        <span className="text-xs hidden sm:inline">{label}</span>
      </div>
    </header>
  );
}
