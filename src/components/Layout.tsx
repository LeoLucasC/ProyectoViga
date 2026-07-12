import { useState, type ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar, MenuButton, MobileBottomNav } from "./Sidebar";
import { useTelemetry } from "../context/TelemetryContext";

type Page = "dashboard" | "historial" | "settings";

export function Layout({
  activePage,
  onNavigate,
  children,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}) {
  const { connectionStatus } = useTelemetry();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen flex bg-surface-950 text-surface-200 overflow-hidden">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onToggle={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header connectionStatus={connectionStatus}>
          <MenuButton onClick={() => setMobileOpen((v) => !v)} />
        </Header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <MobileBottomNav activePage={activePage} onNavigate={onNavigate} />
    </div>
  );
}
