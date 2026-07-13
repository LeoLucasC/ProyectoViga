import { useState, useEffect } from "react";
import { Activity, Building2, MapPin, ChevronRight, Loader2 } from "lucide-react";

const BASE = "/api";

interface Viga {
  viga_id: number;
  nombre: string;
  ubicacion: string;
  created_at: string;
}

interface Props {
  onSelect: (viga: Viga) => void;
  onLogout: () => void;
}

export function BeamSelect({ onSelect, onLogout }: Props) {
  const [vigas, setVigas] = useState<Viga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE}/vigas`, {
      headers: {
        "Content-Type": "application/json",
        // Pass auth token if needed
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar vigas");
        return res.json();
      })
      .then(setVigas)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-100">
            Seleccionar Viga
          </h1>
          <p className="text-surface-400 text-sm mt-2">
            Elige la viga que deseas monitorear
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-danger-400/10 border border-danger-400/20 text-danger-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Viga Cards */}
        <div className="space-y-3">
          {vigas.map((viga) => (
            <button
              key={viga.viga_id}
              onClick={() => onSelect(viga)}
              className="w-full text-left group p-5 rounded-xl bg-white/[0.03] border border-surface-800 
                         hover:bg-white/[0.06] hover:border-primary-500/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/20 
                                flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-surface-100 font-semibold group-hover:text-primary-300 transition-colors">
                      {viga.nombre}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-surface-400 text-sm">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{viga.ubicacion}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-surface-600 group-hover:text-primary-400 
                                         group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>

        {/* No vigas */}
        {!loading && !error && vigas.length === 0 && (
          <div className="text-center py-12 text-surface-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay vigas registradas</p>
            <p className="text-sm mt-1">Ejecuta el seed para crear vigas de ejemplo</p>
          </div>
        )}

        {/* Logout */}
        <div className="mt-10 text-center">
          <button
            onClick={onLogout}
            className="text-sm text-surface-500 hover:text-surface-300 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
