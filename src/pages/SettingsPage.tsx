import { Settings } from "lucide-react";
import { useState } from "react";
import { SensoresTab } from "../components/SensoresTab";
import { UmbralesTab } from "../components/UmbralesTab";
import { ConexionTab } from "../components/ConexionTab";
import type { TabId } from "../types/telemetry";

const tabs: { id: TabId; label: string }[] = [
  { id: "sensores", label: "Sensores" },
  { id: "umbrales", label: "Umbrales" },
  { id: "conexion", label: "Conexión" },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("sensores");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Settings size={18} className="text-surface-400" />
        <h2 className="text-white font-semibold text-lg">Configuración</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-surface-900 rounded-xl p-1 border border-surface-800 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-primary-500/15 text-primary-400"
                : "text-surface-400 hover:text-surface-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === "sensores" && <SensoresTab />}
        {activeTab === "umbrales" && <UmbralesTab />}
        {activeTab === "conexion" && <ConexionTab />}
      </div>
    </div>
  );
}
