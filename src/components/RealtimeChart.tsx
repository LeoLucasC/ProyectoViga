import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { TelemetryPoint } from "../types/telemetry";
import { formatTimestamp } from "../utils/format";

interface RealtimeChartProps {
  data: TelemetryPoint[];
  title: string;
  unit: string;
  color: string;
  type?: "line" | "area";
  domain?: [number, number];
}

export function RealtimeChart({
  data,
  title,
  unit,
  color,
  type = "line",
  domain,
}: RealtimeChartProps) {
  const Chart = type === "area" ? AreaChart : LineChart;
  const DataComponent = type === "area" ? Area : Line;

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        <span className="text-surface-400 text-xs font-mono">
          {data.length > 0
            ? `${data[data.length - 1].valor.toFixed(2)} ${unit}`
            : `— ${unit}`}
        </span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2e303a"
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              stroke="#606d85"
              tick={{ fontSize: 10, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={domain ?? ["dataMin - 2", "dataMax + 2"]}
              stroke="#606d85"
              tick={{ fontSize: 10, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <Tooltip
              contentStyle={{
                background: "#1e2230",
                border: "1px solid #3d4556",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "monospace",
              }}
              labelStyle={{ color: "#c5ccdb" }}
              labelFormatter={formatTimestamp}
              formatter={(value: number) => [
                `${value.toFixed(2)} ${unit}`,
                title,
              ]}
            />
            <DataComponent
              type="monotone"
              dataKey="valor"
              stroke={color}
              strokeWidth={2}
              fill={type === "area" ? `url(#grad-${color})` : undefined}
              dot={false}
              animationDuration={200}
              isAnimationActive={false}
            />
          </Chart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
