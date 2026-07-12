import { Bell } from "lucide-react";
import { ThresholdEditor } from "./ThresholdEditor";

export function UmbralesTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white font-semibold text-sm mb-1">
        <Bell size={16} className="text-warning-400" />
        <span>Umbrales de Alerta</span>
      </div>
      <p className="text-surface-400 text-xs mb-4">
        Define los valores de alerta y crítico para cada tipo de sensor.
      </p>
      <ThresholdEditor />
    </div>
  );
}
