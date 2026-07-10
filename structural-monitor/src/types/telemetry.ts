export type SensorType = "distancia" | "vibracion";

export interface TelemetryMessage {
  timestamp: string;
  sensor_tipo: SensorType;
  valor: number;
}

export interface TelemetryPoint {
  timestamp: number;
  valor: number;
}

export type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

export type EstructuraStatus = "stable" | "alert" | "critical";

export interface EstructuraState {
  distanciaActual: number | null;
  vibracionActual: number | null;
  distanciaHistory: TelemetryPoint[];
  vibracionHistory: TelemetryPoint[];
  connectionStatus: ConnectionStatus;
  estructuraStatus: EstructuraStatus;
}

export const MAX_HISTORY_POINTS = 50;
export const DISTANCIA_ALERT_THRESHOLD = 40;
export const DISTANCIA_CRITICAL_THRESHOLD = 60;
export const VIBRACION_ALERT_THRESHOLD = 0.8;
export const VIBRACION_CRITICAL_THRESHOLD = 1.5;
