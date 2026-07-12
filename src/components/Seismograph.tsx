import { useRef, useEffect, useCallback } from "react";
import { Activity } from "lucide-react";
import type { TelemetryPoint } from "../types/telemetry";

interface Serie {
  data: TelemetryPoint[];
  color: string;
  label: string;
}

interface Props {
  series: Serie[];
  avg: number;
  max: number;
  min: number;
}

export function Seismograph({ series, avg, max, min }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const scrollRef = useRef(0);

  // data total para stats de zoom
  const allData = series.flatMap((s) => s.data);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const pad = { top: 20, bottom: 36, left: 10, right: 10 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Fondo negro CRT
    ctx.fillStyle = "#0a0c14";
    ctx.fillRect(0, 0, w, h);

    // Rejilla tenue
    ctx.strokeStyle = "rgba(34, 197, 94, 0.08)";
    ctx.lineWidth = 1;
    for (let y = 0; y <= 4; y++) {
      const yy = pad.top + (plotH / 4) * y;
      ctx.beginPath();
      ctx.moveTo(pad.left, yy);
      ctx.lineTo(w - pad.right, yy);
      ctx.stroke();
    }
    for (let x = 0; x <= 8; x++) {
      const xx = pad.left + (plotW / 8) * x;
      ctx.beginPath();
      ctx.moveTo(xx, pad.top);
      ctx.lineTo(xx, h - pad.bottom);
      ctx.stroke();
    }

    // Línea base discontinua
    ctx.strokeStyle = "rgba(34, 197, 94, 0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + plotH / 2);
    ctx.lineTo(w - pad.right, pad.top + plotH / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (allData.length < 2) {
      ctx.fillStyle = "#22c55e";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Esperando datos...", w / 2, h / 2);
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    // Escala global (ambas series)
    const allValues = allData.map((p) => p.valor);
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const range = Math.max(dataMax - dataMin, 0.01);
    const padRange = range * 0.15;
    const yMin = dataMin - padRange;
    const yMax = dataMax + padRange;
    const yRange = yMax - yMin;

    const toY = (v: number) => pad.top + plotH * (1 - (v - yMin) / yRange);

    scrollRef.current += 0.3;
    const offset = scrollRef.current % plotW;

    // Leyenda
    const legendY = h - 6;
    let legendX = pad.left;
    ctx.font = "11px monospace";
    ctx.textBaseline = "bottom";
    for (const s of series) {
      const visibleCount = Math.min(s.data.length, 120);
      if (visibleCount < 2) continue;
      // círculo + label
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(legendX + 5, legendY - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      legendX += 14;
      ctx.fillText(s.label, legendX, legendY);
      const labelW = ctx.measureText(s.label).width;
      legendX += labelW + 16;
    }

    // Dibujar cada serie
    for (const s of series) {
      const visibleCount = Math.min(s.data.length, 120);
      if (visibleCount < 2) continue;
      const slice = s.data.slice(-visibleCount);
      const stepX = plotW / visibleCount;

      // Glow del color de la serie
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 8;

      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      slice.forEach((pt, i) => {
        const x = pad.left + i * stepX;
        const y = toY(pt.valor);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Trazo fino interno
      ctx.shadowBlur = 0;
      ctx.strokeStyle = s.color + "66";
      ctx.lineWidth = 1;
      ctx.beginPath();
      slice.forEach((pt, i) => {
        const x = pad.left + i * stepX;
        const y = toY(pt.valor);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    animRef.current = requestAnimationFrame(draw);
  }, [series, allData]);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth * window.devicePixelRatio;
      canvas.height = parent.clientHeight * window.devicePixelRatio;
      canvas.style.width = parent.clientWidth + "px";
      canvas.style.height = parent.clientHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);
    animRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  // último valor visible para header
  const lastVal = series.length > 0 && series[0].data.length > 0
    ? series[0].data[series[0].data.length - 1].valor
    : null;

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold leading-tight">Sismógrafo</h3>
            <p className="text-surface-500 text-[11px] leading-tight">Vibración estructural</p>
          </div>
        </div>
        {lastVal !== null && (
          <span className="text-green-400 text-xs font-mono tabular-nums">
            {lastVal.toFixed(3)} m/s²
          </span>
        )}
      </div>

      {/* Canvas */}
      <div className="h-64 w-full relative">
        <canvas ref={canvasRef} className="w-full h-full" />

        {/* Stats overlay inferior */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 bg-surface-950/60 backdrop-blur-sm rounded-lg border border-surface-800">
          <div className="flex gap-4 text-[10px] font-mono">
            <span className="text-surface-400">
              Prom: <span className="text-green-400">{avg.toFixed(3)}</span>
            </span>
            <span className="text-surface-400">
              Máx: <span className="text-danger-400">{max.toFixed(3)}</span>
            </span>
            <span className="text-surface-400">
              Mín: <span className="text-primary-400">{min.toFixed(3)}</span>
            </span>
          </div>
          <span className="text-surface-500 text-[10px] font-mono">{allData.length} pts</span>
        </div>
      </div>
    </div>
  );
}
