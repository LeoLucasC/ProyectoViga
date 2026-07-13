import type { SensorCreate, SensorResponse, SensorUpdate, Threshold, Viga } from "../types/telemetry";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// Sensors
export const getSensors = () => request<SensorResponse[]>("/sensors");
export const getNextSensorId = () => request<{ sensor_id: string }>("/sensors/next-id");
export const createSensor = (data: SensorCreate) =>
  request<SensorResponse>("/sensors", { method: "POST", body: JSON.stringify(data) });
export const updateSensor = (sensorId: string, data: SensorUpdate) =>
  request<SensorResponse>(`/sensors/${sensorId}`, { method: "PUT", body: JSON.stringify(data) });
export const toggleSensor = (sensorId: string) =>
  request<SensorResponse>(`/sensors/${sensorId}/toggle`, { method: "PATCH" });
export const deleteSensor = (sensorId: string) =>
  request<{ status: string; message: string }>(`/sensors/${sensorId}`, { method: "DELETE" });

// Thresholds
export const getThresholds = () => request<Threshold[]>("/thresholds");
export const updateThreshold = (data: Threshold) =>
  request<{ status: string }>("/thresholds", { method: "PUT", body: JSON.stringify(data) });

// History
export interface HistoryPoint {
  timestamp: number;
  sensor_id: string;
  valor: number;
  sensor_tipo: "distancia" | "vibracion";
  // Parámetros detallados de vibración (opcionales)
  ax?: number;
  ay?: number;
  az?: number;
  adx?: number;
  ady?: number;
  adz?: number;
  aver?: number;
  gx?: number;
  gy?: number;
  gz?: number;
  temp?: number;
  evento?: number;
}

export interface HistoryResponse {
  data: HistoryPoint[];
  total: number;
}

export const getHistory = (params?: {
  sensor_tipo?: string;
  viga_id?: number;
  limit?: number;
  since?: string;
}) => {
  const search = new URLSearchParams();
  if (params?.sensor_tipo) search.set("sensor_tipo", params.sensor_tipo);
  if (params?.viga_id) search.set("viga_id", String(params.viga_id));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.since) search.set("since", params.since);
  const qs = search.toString();
  return request<HistoryResponse>(`/history${qs ? `?${qs}` : ""}`);
};

// Vigas (CRUD)
export const getVigas = () => request<Viga[]>("/vigas");
export const createViga = (data: { nombre: string; ubicacion: string }) =>
  request<Viga>("/vigas", { method: "POST", body: JSON.stringify(data) });
export const updateViga = (vigaId: number, data: { nombre: string; ubicacion: string }) =>
  request<Viga>(`/vigas/${vigaId}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteViga = (vigaId: number) =>
  request<{ status: string; message: string }>(`/vigas/${vigaId}`, { method: "DELETE" });

// Reset
export const resetTelemetry = () =>
  request<{ status: string; message: string }>("/reset", { method: "POST" });
