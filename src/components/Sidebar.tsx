import { LayoutDashboard, History, Settings, Menu, X } from "lucide-react";

type Page = "dashboard" | "historial" | "settings";

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "historial", label: "Historial", icon: History },
  { id: "settings", label: "Configuración", icon: Settings },
];

export function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onToggle,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
  mobileOpen: boolean;
  onToggle: () => void;
}) {
  const sidebarContent = (
    <div className="h-full bg-surface-900 border-r border-surface-800 flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-surface-800 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">V</span>
        </div>
        <div>
          <h1 className="text-white font-semibold text-sm leading-tight">VigaMonitor</h1>
          <p className="text-surface-400 text-[11px] leading-tight">Structural Telemetry</p>
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
              onClick={() => { onNavigate(item.id); onToggle(); }}
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
      <div className="p-4 border-t border-surface-800 shrink-0">
        <p className="text-[11px] text-surface-500 text-center">Digital Twin v1.0</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0">{sidebarContent}</aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onToggle} />
          {/* Sidebar panel */}
          <aside className="relative w-64 max-w-[80vw] h-full shrink-0 z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

/* Mobile toggle button — render in header */
export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
    >
      <Menu size={18} />
    </button>
  );
}

/* Mobile bottom nav bar (shown on small screens when sidebar is closed) */
export function MobileBottomNav({
  activePage,
  onNavigate,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
}) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-900 border-t border-surface-800 flex items-center justify-around px-2 py-1 safe-area-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg text-[10px] font-medium transition-colors ${
              active
                ? "text-primary-400"
                : "text-surface-400 hover:text-surface-200"
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
