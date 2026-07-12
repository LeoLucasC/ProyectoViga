import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
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

interface ThresholdConfig {
  alert: number;
  critical: number;
}

interface TelemetryContextValue extends EstructuraState {
  resetData: () => void;
  refreshThresholds: () => void;
}

const defaultState: EstructuraState = {
  distanciaActual: null,
  vibracionActual: null,
  vibracionIzquierdo: null,
  vibracionDerecho: null,
  distanciaHistory: [],
  vibracionHistory: [],
  vibracionIzquierdoHistory: [],
  vibracionDerechoHistory: [],
  connectionStatus: "disconnected",
  estructuraStatus: "stable",
};

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

function computeEstructuraStatus(
  distancia: number | null,
  vibracion: number | null,
  thresholds: { distancia: ThresholdConfig; vibracion: ThresholdConfig }
): EstructuraStatus {
  const d = distancia ?? 0;
  const v = vibracion ?? 0;

  if (d >= thresholds.distancia.critical || v >= thresholds.vibracion.critical) {
    return "critical";
  }
  if (d >= thresholds.distancia.alert || v >= thresholds.vibracion.alert) {
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
  const [thresholdsConfig, setThresholdsConfig] = useState<{
    distancia: ThresholdConfig;
    vibracion: ThresholdConfig;
  }>({
    distancia: { alert: DISTANCIA_ALERT_THRESHOLD, critical: DISTANCIA_CRITICAL_THRESHOLD },
    vibracion: { alert: VIBRACION_ALERT_THRESHOLD, critical: VIBRACION_CRITICAL_THRESHOLD },
  });

  const refreshThresholds = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/api/thresholds");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const d = data.find((t: any) => t.sensor_tipo === "distancia");
        const v = data.find((t: any) => t.sensor_tipo === "vibracion");
        setThresholdsConfig({
          distancia: { alert: d?.alert_valor ?? DISTANCIA_ALERT_THRESHOLD, critical: d?.critical_valor ?? DISTANCIA_CRITICAL_THRESHOLD },
          vibracion: { alert: v?.alert_valor ?? VIBRACION_ALERT_THRESHOLD, critical: v?.critical_valor ?? VIBRACION_CRITICAL_THRESHOLD },
        });
      }
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    refreshThresholds();
  }, [refreshThresholds]);

  const handleMessage = useCallback((raw: string) => {
    try {
      const msg: TelemetryMessage = JSON.parse(raw);
      const point: TelemetryPoint = {
        timestamp: new Date(msg.timestamp).getTime(),
        valor: msg.valor,
      };

      setState((prev) => {
        const isDistancia = msg.sensor_tipo === "distancia";
        // determinamos si es izquierda o derecha por el sensor_id
        const isIzquierdo = msg.sensor_id?.includes("IZQUIERDO");
        const isDerecho = msg.sensor_id?.includes("DERECHO");

        let newDistanciaHistory = prev.distanciaHistory;
        let newVibracionHistory = prev.vibracionHistory;
        let newVibracionIzquierdoHistory = prev.vibracionIzquierdoHistory;
        let newVibracionDerechoHistory = prev.vibracionDerechoHistory;

        if (isDistancia) {
          newDistanciaHistory = appendPoint(prev.distanciaHistory, point);
        } else if (isIzquierdo) {
          newVibracionIzquierdoHistory = appendPoint(prev.vibracionIzquierdoHistory, point);
          // también alimenta el historial general de vibración
          newVibracionHistory = appendPoint(prev.vibracionHistory, point);
        } else if (isDerecho) {
          newVibracionDerechoHistory = appendPoint(prev.vibracionDerechoHistory, point);
          newVibracionHistory = appendPoint(prev.vibracionHistory, point);
        } else {
          // fallback: sensor genérico de vibración
          newVibracionHistory = appendPoint(prev.vibracionHistory, point);
        }

        const newDistancia = isDistancia ? msg.valor : prev.distanciaActual;
        const newVibracion = !isDistancia ? msg.valor : prev.vibracionActual;
        const newIzquierdo = isIzquierdo ? msg.valor : prev.vibracionIzquierdo;
        const newDerecho = isDerecho ? msg.valor : prev.vibracionDerecho;

        return {
          ...prev,
          distanciaActual: newDistancia,
          vibracionActual: newVibracion,
          vibracionIzquierdo: newIzquierdo,
          vibracionDerecho: newDerecho,
          distanciaHistory: newDistanciaHistory,
          vibracionHistory: newVibracionHistory,
          vibracionIzquierdoHistory: newVibracionIzquierdoHistory,
          vibracionDerechoHistory: newVibracionDerechoHistory,
        };
      });
    } catch {
      // ignore malformed messages
    }
  }, []);

  // Recompute estructuraStatus whenever state or thresholds change
  // We handle this by computing in the render based on current state
  const { distanciaActual, vibracionActual } = state;
  const estructuraStatus = computeEstructuraStatus(
    distanciaActual,
    vibracionActual,
    thresholdsConfig
  );

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
    <TelemetryContext.Provider value={{ ...state, estructuraStatus, resetData, refreshThresholds }}>
      {children}
    </TelemetryContext.Provider>
  );
}


export function useTelemetry() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error("useTelemetry must be used inside TelemetryProvider");
  return ctx;
}
