import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  TelemetryMessage,
  TelemetryPoint,
  ConnectionStatus,
  EstructuraStatus,
  EstructuraState,
} from "../types/telemetry";
import {
  MAX_HISTORY_POINTS,
  DISTANCIA_ALERT_THRESHOLD,
  DISTANCIA_CRITICAL_THRESHOLD,
  VIBRACION_ALERT_THRESHOLD,
  VIBRACION_CRITICAL_THRESHOLD,
} from "../types/telemetry";
import { useWebSocket } from "../hooks/useWebSocket";

interface TelemetryContextValue extends EstructuraState {
  resetData: () => void;
}

const defaultState: EstructuraState = {
  distanciaActual: null,
  vibracionActual: null,
  distanciaHistory: [],
  vibracionHistory: [],
  connectionStatus: "disconnected",
  estructuraStatus: "stable",
};

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

function computeEstructuraStatus(
  distancia: number | null,
  vibracion: number | null
): EstructuraStatus {
  const d = distancia ?? 0;
  const v = vibracion ?? 0;

  if (
    d >= DISTANCIA_CRITICAL_THRESHOLD ||
    v >= VIBRACION_CRITICAL_THRESHOLD
  ) {
    return "critical";
  }
  if (d >= DISTANCIA_ALERT_THRESHOLD || v >= VIBRACION_ALERT_THRESHOLD) {
    return "alert";
  }
  return "stable";
}

function appendPoint(
  history: TelemetryPoint[],
  point: TelemetryPoint
): TelemetryPoint[] {
  const next = [...history, point];
  if (next.length > MAX_HISTORY_POINTS) {
    return next.slice(next.length - MAX_HISTORY_POINTS);
  }
  return next;
}

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EstructuraState>(defaultState);

  const handleMessage = useCallback((raw: string) => {
    try {
      const msg: TelemetryMessage = JSON.parse(raw);
      const point: TelemetryPoint = {
        timestamp: new Date(msg.timestamp).getTime(),
        valor: msg.valor,
      };

      setState((prev) => {
        const isDistancia = msg.sensor_tipo === "distancia";
        const newHistory = isDistancia
          ? appendPoint(prev.distanciaHistory, point)
          : appendPoint(prev.vibracionHistory, point);

        const newDistancia =
          msg.sensor_tipo === "distancia" ? msg.valor : prev.distanciaActual;
        const newVibracion =
          msg.sensor_tipo === "vibracion" ? msg.valor : prev.vibracionActual;

        return {
          ...prev,
          distanciaActual: newDistancia,
          vibracionActual: newVibracion,
          distanciaHistory: isDistancia ? newHistory : prev.distanciaHistory,
          vibracionHistory: isDistancia ? prev.vibracionHistory : newHistory,
          estructuraStatus: computeEstructuraStatus(newDistancia, newVibracion),
        };
      });
    } catch {
      // ignore malformed messages
    }
  }, []);

  const handleStatusChange = useCallback((status: ConnectionStatus) => {
    setState((prev) => ({ ...prev, connectionStatus: status }));
  }, []);

  useWebSocket({
    url: "ws://localhost:8000/ws/telemetria",
    onMessage: handleMessage,
    onStatusChange: handleStatusChange,
  });

  const resetData = useCallback(() => {
    setState(defaultState);
  }, []);

  return (
    <TelemetryContext.Provider value={{ ...state, resetData }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error("useTelemetry must be used inside TelemetryProvider");
  return ctx;
}
