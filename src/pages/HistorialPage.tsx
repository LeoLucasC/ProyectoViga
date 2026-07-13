import { useState, useEffect, useCallback } from "react";
import { Clock, Ruler, Waves, Download, RefreshCw, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { getHistory, getThresholds } from "../services/api";
import type { HistoryPoint, Threshold } from "../types/telemetry";
import type { SensorType } from "../types/telemetry";

const PAGE_SIZE = 25;

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateShort(ts: number): string {
  return new Date(ts).toLocaleString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getReadingStatus(
  valor: number,
  tipo: SensorType,
  thresholds: Threshold[]
): "normal" | "alert" | "critical" {
  const t = thresholds.find((th) => th.sensor_tipo === tipo);
  if (!t) return "normal";
  if (valor >= t.critical_valor) return "critical";
  if (valor >= t.alert_valor) return "alert";
  return "normal";
}

export function HistorialPage() {
  const [allData, setAllData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterLimit, setFilterLimit] = useState(200);
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [page, setPage] = useState(0);

  // Stats from filtered data
  const filtered = filterTipo
    ? allData.filter((p) => p.sensor_tipo === filterTipo)
    : allData;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageData = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const values = filtered.map((p) => p.valor);
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const min = values.length > 0 ? Math.min(...values) : 0;
  const distCount = allData.filter((p) => p.sensor_tipo === "distancia").length;
  const vibCount = allData.filter((p) => p.sensor_tipo === "vibracion").length;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const storedViga = localStorage.getItem("viga_selected");
      const selectedViga = storedViga ? JSON.parse(storedViga) : null;

      const [historyRes, thresholdsRes] = await Promise.all([
        getHistory({ limit: filterLimit, viga_id: selectedViga?.viga_id }),
        getThresholds(),
      ]);
      setAllData(historyRes.data);
      setThresholds(thresholdsRes);
      setPage(0);
    } catch (err: any) {
      setError(err.message || "Error al cargar historial");
    } finally {
      setLoading(false);
    }
  }, [filterLimit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    if (filtered.length === 0) return;

    const header = [
      "timestamp", "sensor_id", "sensor_tipo", "valor",
      "ax (m/s²)", "ay (m/s²)", "az (m/s²)",
      "adx (m/s²)", "ady (m/s²)", "adz (m/s²)", "aver (m/s²)",
      "gx (rad/s)", "gy (rad/s)", "gz (rad/s)",
      "temp (°C)", "evento",
    ].join(",");

    const rows = filtered.map((p) => {
      return [
        new Date(p.timestamp).toISOString(),
        p.sensor_id,
        p.sensor_tipo,
        p.valor ?? "",
        p.ax ?? "", p.ay ?? "", p.az ?? "",
        p.adx ?? "", p.ady ?? "", p.adz ?? "", p.aver ?? "",
        p.gx ?? "", p.gy ?? "", p.gz ?? "",
        p.temp ?? "", p.evento ?? "",
      ].join(",");
    });

    const BOM = "\uFEFF";
    const csv = BOM + [header, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vigamonitor_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-surface-400" />
          <h2 className="text-white font-semibold text-lg">Historial de Telemetría</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-300 bg-surface-800 hover:bg-surface-700 disabled:opacity-30 rounded-lg transition-colors"
          >
            <Download size={14} />
            Exportar CSV
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 disabled:opacity-50 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="bg-surface-900/80 backdrop-blur-sm rounded-xl border border-surface-800 p-4">
        <div className="flex flex-wrap items-center gap-4 lg:gap-8 text-xs font-mono">
          <span className="text-surface-400">
            Total <span className="text-white">{allData.length}</span>
          </span>
          <span className="text-surface-500">|</span>
          <span className="text-surface-400">
            Distancia <span className="text-primary-400">{distCount}</span>
          </span>
          <span className="text-surface-400">
            Vibración <span className="text-success-400">{vibCount}</span>
          </span>
          <span className="text-surface-500">|</span>
          <span className="text-surface-400">
            Prom <span className="text-surface-200">{avg.toFixed(1)}</span>
          </span>
          <span className="text-surface-400">
            Máx <span className="text-danger-400">{max.toFixed(1)}</span>
          </span>
          <span className="text-surface-400">
            Mín <span className="text-primary-400">{min.toFixed(1)}</span>
          </span>
          <span className="text-surface-500">|</span>
          <span className="text-surface-400">
            Mostrando <span className="text-white">{filtered.length}</span> de{" "}
            <span className="text-white">{allData.length}</span>
          </span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-surface-400">
          <Filter size={14} />
          <span className="text-xs">Filtros:</span>
        </div>
        <select
          value={filterTipo}
          onChange={(e) => { setFilterTipo(e.target.value); setPage(0); }}
          className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500"
        >
          <option value="">Todos los sensores</option>
          <option value="distancia">Distancia</option>
          <option value="vibracion">Vibración</option>
        </select>
        <select
          value={filterLimit}
          onChange={(e) => setFilterLimit(Number(e.target.value))}
          className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500"
        >
          <option value={100}>Últimas 100 lecturas</option>
          <option value={500}>Últimas 500 lecturas</option>
          <option value={1000}>Últimas 1,000 lecturas</option>
          <option value={5000}>Últimas 5,000 lecturas</option>
          <option value={10000}>Últimas 10,000 lecturas</option>
        </select>
        {error && <span className="text-danger-400 text-xs">{error}</span>}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-surface-500">
          <RefreshCw size={20} className="animate-spin mr-2" />
          <span className="text-sm">Cargando historial...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-surface-500">
          <Clock size={40} className="mb-3 opacity-50" />
          <p className="text-sm">No hay datos de telemetría</p>
        </div>
      ) : (
        <>
          <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-800 text-surface-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">#</th>
                  <th className="text-left px-5 py-3 font-medium">Hora</th>
                  <th className="text-left px-5 py-3 font-medium">Sensor ID</th>
                  <th className="text-left px-5 py-3 font-medium">Tipo</th>
                  <th className="text-right px-5 py-3 font-medium">Valor</th>
                  <th className="text-right px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((point, i) => {
                  const globalIdx = safePage * PAGE_SIZE + i;
                  const status = getReadingStatus(point.valor, point.sensor_tipo, thresholds);
                  const statusColors =
                    status === "critical"
                      ? "text-danger-400 bg-danger-400/10"
                      : status === "alert"
                        ? "text-warning-400 bg-warning-400/10"
                        : "text-success-400 bg-success-400/10";

                  return (
                    <tr
                      key={`${point.timestamp}-${i}`}
                      className="border-b border-surface-800/50 last:border-0 hover:bg-surface-800/30 transition-colors"
                    >
                      <td className="px-5 py-2.5 text-surface-500 text-xs font-mono">
                        {globalIdx + 1}
                      </td>
                      <td className="px-5 py-2.5 font-mono text-surface-300 text-xs">
                        {formatDate(point.timestamp)}
                      </td>
                      <td className="px-5 py-2.5 font-mono text-xs text-surface-400">
                        {point.sensor_id}
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            point.sensor_tipo === "distancia"
                              ? "bg-primary-400/10 text-primary-400"
                              : "bg-success-400/10 text-success-400"
                          }`}
                        >
                          {point.sensor_tipo === "distancia" ? (
                            <Ruler size={12} />
                          ) : (
                            <Waves size={12} />
                          )}
                          {point.sensor_tipo === "distancia" ? "Distancia" : "Vibración"}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-center text-surface-500 text-xs font-mono">
                        {point.sensor_tipo === "distancia" ? "mm" : "m/s²"}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-surface-200 font-medium tabular-nums">
                        {point.valor.toFixed(2)}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors}`}>
                          {status === "critical"
                            ? "CRÍTICO"
                            : status === "alert"
                              ? "ALERTA"
                              : "NORMAL"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between px-1">
            <span className="text-surface-500 text-xs font-mono">
              Página {safePage + 1} de {totalPages} · {filtered.length} registros
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, safePage - 1))}
                disabled={safePage === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-surface-300 bg-surface-800 hover:bg-surface-700 disabled:opacity-30 rounded-lg transition-colors"
              >
                <ChevronLeft size={14} />
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                disabled={safePage >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-surface-300 bg-surface-800 hover:bg-surface-700 disabled:opacity-30 rounded-lg transition-colors"
              >
                Siguiente
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
