export type SensorType = "distancia" | "vibracion";

export interface TelemetryMessage {
  timestamp: string;
  sensor_tipo: SensorType;
  sensor_id?: string;
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
  vibracionIzquierdo: number | null;
  vibracionDerecho: number | null;
  distanciaHistory: TelemetryPoint[];
  vibracionHistory: TelemetryPoint[];
  vibracionIzquierdoHistory: TelemetryPoint[];
  vibracionDerechoHistory: TelemetryPoint[];
  connectionStatus: ConnectionStatus;
  estructuraStatus: EstructuraStatus;
}

export const MAX_HISTORY_POINTS = 50;
export const DISTANCIA_ALERT_THRESHOLD = 40;
export const DISTANCIA_CRITICAL_THRESHOLD = 60;
export const VIBRACION_ALERT_THRESHOLD = 0.8;
export const VIBRACION_CRITICAL_THRESHOLD = 1.5;

// ── Sensor management types ──

export interface SensorResponse {
  sensor_id: string;
  sensor_tipo: SensorType;
  nombre: string | null;
  ubicacion: string | null;
  activo: boolean;
  created_at: string;
  viga_id: number | null;
  online: boolean;
  reading_status: "normal" | "alert" | "critical" | null;
  latest_valor: number | null;
  latest_unidad: string | null;
  latest_time: string | null;
}

export interface SensorCreate {
  sensor_tipo: SensorType;
  nombre: string;
  ubicacion: string;
  sensor_id?: string;
  viga_id?: number | null;
}

export interface SensorUpdate {
  nombre?: string;
  ubicacion?: string;
  viga_id?: number | null;
}

export interface Threshold {
  sensor_tipo: string;
  alert_valor: number;
  critical_valor: number;
}

export type TabId = "sensores" | "umbrales" | "conexion" | "vigas";

// ── Viga types ──

export interface Viga {
  viga_id: number;
  nombre: string;
  ubicacion: string;
  created_at: string;
}
