import { useState, type FormEvent } from "react";
import { 
  Activity, 
  Eye, 
  EyeOff, 
  Loader2, 
  LogIn, 
  AlertCircle, 
  ChevronLeft,
  User,
  Lock
} from "lucide-react";

const BASE = "/api";

interface Props {
  onLogin: (token: string, username: string) => void;
  onBack: () => void;
}

export function Login({ onLogin, onBack }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Todos los campos son obligatorios");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || "Credenciales inválidas");
      }

      const data = await res.json();
      onLogin(data.token, data.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950 font-sans p-4 sm:p-6">
      
      {/* ── Fondo Animado: Mesh Gradient con Blancos y Azules ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base oscura con grano sutil */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,1)_0%,rgba(2,6,23,1)_100%)]" />
        
        {/* Blob Blanco Superior */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-white/10 blur-[120px] animate-pulse" />
        {/* Blob Azul Inferior */}
        <div className="absolute -bottom-40 -right-20 w-[700px] h-[700px] rounded-full bg-primary-500/20 blur-[120px] animate-pulse [animation-delay:1.5s]" />
        {/* Blob Cyan Medio */}
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-400/10 blur-[100px] animate-pulse [animation-delay:3s]" />
      </div>

      {/* ── Botón Volver Flotante ── */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300 shadow-lg"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver
      </button>

      {/* ── Contenedor Principal (Glassmorphism Split Card) ── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-2xl bg-white/[0.03]">
        
        {/* Sombra interna superior para efecto glass */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent z-20" />

        {/* ── Columna Izquierda: Imagen y Branding ── */}
        <div className="hidden lg:block relative overflow-hidden">
          {/* Imagen del ESP32 / Sensor */}
          <img 
            src="https://images.pexels.com/photos/13162095/pexels-photo-13162095.jpeg" 
            alt="Sensor ESP32 de Monitoreo Estructural" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Overlay oscuro/azul degradado para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
          {/* Overlay de cristal */}
          <div className="absolute inset-0 backdrop-blur-sm bg-white/[0.02]" />
          
          {/* Contenido de la imagen */}
          <div className="absolute bottom-0 left-0 right-0 p-10 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-primary-500/20 border border-primary-400/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs font-medium text-primary-100 tracking-wide">Sistema Activo</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Monitoreo Estructural en Tiempo Real
            </h2>
            <p className="text-slate-300 text-sm max-w-sm">
              Visualización de datos de sensores IoT de alta precisión. Detecta variaciones y previene fallos estructurales.
            </p>
          </div>
        </div>

        {/* ── Columna Derecha: Formulario de Login ── */}
        <div className="relative p-8 sm:p-12 flex flex-col justify-center bg-slate-950/40">
          
          {/* ── Logo / Header ── */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/40 ring-1 ring-white/20">
              <Activity className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Accede al panel de control de VigaMonitor
            </p>
          </div>

          {/* ── Mensaje de Error ── */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Formulario ── */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campo Usuario */}
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Usuario
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-white/[0.07] transition-all duration-300 shadow-inner"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-white/[0.07] transition-all duration-300 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  tabIndex={-1}
                  aria-label="Mostrar/ocultar contraseña"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Botón Submit con efecto Shine */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {/* Fondo degradado base */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 transition-all duration-500 group-hover:from-primary-500 group-hover:via-primary-400 group-hover:to-primary-500" />
              
              {/* Efecto Shine al hacer Hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.4)_50%,transparent_80%)] bg-[length:200%_100%] animate-[shine_1.5s_infinite]"></div>
              </div>
              
              {/* Sombra base y hover */}
              <div className="absolute inset-0 shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-shadow duration-500" />
              
              <span className="relative z-10 flex items-center justify-center gap-2 tracking-wide">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verificando credenciales...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Ingresar al Panel
                  </>
                )}
              </span>
            </button>
          </form>

          {/* ── Footer ── */}
          <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500 tracking-wide">
              VigaMonitor IoT © {new Date().getFullYear()} — Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>

      {/* Keyframes para el efecto Shine (asumiendo que Tailwind no lo tiene por defecto) */}
      <style>{`
        @keyframes shine {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}