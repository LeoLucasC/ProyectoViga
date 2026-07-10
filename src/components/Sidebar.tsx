import { LayoutDashboard, History, Settings } from "lucide-react";

type Page = "dashboard" | "historial" | "settings";

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "historial", label: "Historial", icon: History },
  { id: "settings", label: "Configuración", icon: Settings },
];

export function Sidebar({
  activePage,
  onNavigate,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
}) {
  return (
    <aside className="w-64 bg-surface-900 border-r border-surface-800 flex flex-col shrink-0">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-surface-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">V</span>
        </div>
        <div>
          <h1 className="text-white font-semibold text-sm leading-tight">
            VigaMonitor
          </h1>
          <p className="text-surface-400 text-[11px] leading-tight">
            Structural Telemetry
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-primary-500/15 text-primary-400 shadow-sm"
                  : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-800">
        <p className="text-[11px] text-surface-500 text-center">
          Digital Twin v1.0
        </p>
      </div>
    </aside>
  );
}
