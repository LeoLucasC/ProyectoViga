import { useState } from "react";
import { TelemetryProvider } from "./context/TelemetryContext";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { HistorialPage } from "./pages/HistorialPage";
import { SettingsPage } from "./pages/SettingsPage";

type Page = "dashboard" | "historial" | "settings";

const pages: Record<Page, () => JSX.Element> = {
  dashboard: DashboardPage,
  historial: HistorialPage,
  settings: SettingsPage,
};

export default function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const PageComponent = pages[activePage];

  return (
    <TelemetryProvider>
      <Layout activePage={activePage} onNavigate={setActivePage}>
        <PageComponent />
      </Layout>
    </TelemetryProvider>
  );
}
