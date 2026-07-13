import { type ReactNode } from "react";
import { Wifi, WifiOff, RefreshCw, LogOut } from "lucide-react";
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
  onLogout,
  selectedViga,
  children,
}: {
  connectionStatus: ConnectionStatus;
  onLogout?: () => void;
  selectedViga?: { viga_id: number; nombre: string } | null;
  children?: ReactNode;
}) {
  const { Icon, label, className } = statusConfig(connectionStatus);

  return (
    <header className="h-16 bg-surface-900/80 backdrop-blur-md border-b border-surface-800 px-4 lg:px-6 flex items-center justify-between shrink-0 gap-3">
      <div className="flex items-center gap-3">
        {children}
        <div>
          <h2 className="text-white font-semibold text-lg">VigaMonitor</h2>
          {selectedViga && (
            <p className="text-primary-400 text-xs font-medium leading-tight">
              {selectedViga.nombre}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
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

        {onLogout && (
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-surface-400 hover:text-danger-400 hover:bg-danger-400/10 transition-all duration-200 text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        )}
      </div>
    </header>
  );
}
