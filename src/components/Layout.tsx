import type { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
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

  return (
    <div className="h-screen flex bg-surface-950 text-surface-200 overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header connectionStatus={connectionStatus} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
