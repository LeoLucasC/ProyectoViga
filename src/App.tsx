import { useState } from "react";
import { TelemetryProvider } from "./context/TelemetryContext";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { HistorialPage } from "./pages/HistorialPage";
import { SettingsPage } from "./pages/SettingsPage";
import Landing from "./pages/Landing";
import { Login } from "./pages/Login";
import { BeamSelect } from "./pages/BeamSelect";

type View = "landing" | "login" | "beamselect" | "app";
type Page = "dashboard" | "historial" | "settings";

const pages: Record<Page, () => JSX.Element> = {
  dashboard: DashboardPage,
  historial: HistorialPage,
  settings: SettingsPage,
};

export default function App() {
  const [auth, setAuth] = useState<{ token: string; username: string } | null>(
    () => {
      const stored = localStorage.getItem("viga_auth");
      return stored ? JSON.parse(stored) : null;
    }
  );

  const [selectedViga, setSelectedViga] = useState<{ viga_id: number; nombre: string } | null>(
    () => {
      const stored = localStorage.getItem("viga_selected");
      return stored ? JSON.parse(stored) : null;
    }
  );

  const [view, setView] = useState<View>(() => {
    if (auth && selectedViga) return "app";
    if (auth) return "beamselect";
    return "landing";
  });
  const [activePage, setActivePage] = useState<Page>("dashboard");

  function handleLogin(token: string, username: string) {
    const session = { token, username };
    localStorage.setItem("viga_auth", JSON.stringify(session));
    setAuth(session);
    setView("beamselect");
  }

  function handleBeamSelect(viga: { viga_id: number; nombre: string }) {
    localStorage.setItem("viga_selected", JSON.stringify({ viga_id: viga.viga_id, nombre: viga.nombre }));
    setSelectedViga({ viga_id: viga.viga_id, nombre: viga.nombre });
    setView("app");
  }

  function handleLogout() {
    localStorage.removeItem("viga_auth");
    localStorage.removeItem("viga_selected");
    setAuth(null);
    setSelectedViga(null);
    setView("landing");
  }

  // Landing
  if (view === "landing") {
    return <Landing onNavigate={(v) => setView(v)} />;
  }

  // Login
  if (view === "login") {
    return <Login onLogin={handleLogin} onBack={() => setView("landing")} />;
  }

  // Beam selection
  if (view === "beamselect") {
    return <BeamSelect onSelect={handleBeamSelect} onLogout={handleLogout} />;
  }

  // App (dashboard/historial/settings)
  const PageComponent = pages[activePage];

  return (
    <TelemetryProvider>
      <Layout
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={handleLogout}
        selectedViga={selectedViga}
      >
        <PageComponent />
      </Layout>
    </TelemetryProvider>
  );
}
