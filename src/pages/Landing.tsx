import { useState, useEffect, useRef } from "react";

/* ──────────────────────────────────────────────
   CONSTANTES
   ────────────────────────────────────────────── */

const characteristics = [
  {
    title: "Sensor MPU9250",
    desc: "Acelerómetro, giroscopio y magnetómetro para detectar vibraciones, inclinación y movimientos estructurales en tiempo real.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="11" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
      </svg>
    ),
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop",
  },
  {
    title: "Sensor VL53L01X",
    desc: "Sensor de distancia láser (ToF) de alta precisión para medir desplazamientos y deformaciones en la viga.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=400&fit=crop",
  },
  {
    title: "Módulo ESP32",
    desc: "Microcontrolador con WiFi y Bluetooth que centraliza la lectura de sensores y envía los datos a la nube en tiempo real.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="M12 5l7 7-7 7" />
        <path d="M12 12H3" />
        <path d="M3 12l4-4" />
        <path d="M3 12l4 4" />
      </svg>
    ),
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
  },
  {
    title: "Monitoreo en Tiempo Real",
    desc: "Visualización instantánea de datos de aceleración, distancia y ángulos desde cualquier dispositivo conectado.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
  },
  {
    title: "Alertas Inteligentes",
    desc: "Sistema de notificaciones ante vibraciones anómalas, desplazamientos fuera de rango o condiciones de riesgo estructural.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=400&fit=crop",
  },
  {
    title: "Dashboard Interactivo",
    desc: "Panel web con gráficos históricos, exportación de datos y visualización 3D del comportamiento de la viga.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop",
  },
];

const highlights = [
  { value: "2", suffix: "", label: "Sensores Integrados", icon: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="11" />
    </svg>
  )},
  { value: "1", suffix: "", label: "ESP32 Central", icon: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  )},
  { value: "3", suffix: "", label: "Ejes de Medición", icon: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4" y1="4" x2="20" y2="20" />
    </svg>
  )},
  { value: "100", suffix: "%", label: "Monitoreo Remoto", icon: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
      <circle cx="5" cy="12" r="2" />
    </svg>
  )},
];

const navLinks = [
  { label: "Inicio", href: "#" },
  { label: "Características", href: "#caracteristicas" },
  { label: "Equipo", href: "#equipo" },
  { label: "Resultados", href: "#resultados" },
  { label: "Contacto", href: "#contacto" },
];

/* ──────────────────────────────────────────────
   SUB-COMPONENTES
   ────────────────────────────────────────────── */

function Particles({ colors }: { colors: string[] }) {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    delay: Math.random() * 10,
    duration: Math.random() * 20 + 15,
    opacity: Math.random() * 0.5 + 0.1,
    color: colors[i % colors.length],
    driftX: (Math.random() - 0.5) * 200,
    driftY: (Math.random() - 0.5) * 200,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size + 2,
            height: p.size + 2,
            opacity: p.opacity,
            background: p.color,
            boxShadow: `0 0 ${p.size * 8}px ${p.size * 3}px ${p.color.replace("0.", "0.15")}`,
            animation: `float-particle ${p.duration}s ${p.delay}s ease-in-out infinite`,
            "--drift-x": `${p.driftX}px`,
            "--drift-y": `${p.driftY}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function GlowOrb({ className }: { className?: string }) {
  return <div className={`absolute rounded-full blur-3xl animate-glow-pulse ${className}`} />;
}

function CountUp({ end, suffix = "" }: { end: string; suffix?: string }) {
  const [count, setCount] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const numeric = parseInt(end.replace(/,/g, ""));
          if (isNaN(numeric)) {
            setCount(end);
            return;
          }
          const duration = 2500;
          const steps = 80;
          const stepTime = duration / steps;
          let currentStep = 0;
          const timer = setInterval(() => {
            currentStep++;
            const progress = Math.min(currentStep / steps, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * numeric);
            setCount(current.toLocaleString());
            if (progress >= 1) clearInterval(timer);
          }, stepTime);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ──────────────────────────────────────────────
   APP PRINCIPAL
   ────────────────────────────────────────────── */

interface AppProps {
  onNavigate: (view: "login") => void;
}

export default function App({ onNavigate }: AppProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    const onMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  const parallax = (factor: number) => ({
    transform: `translate(${(mousePos.x - 0.5) * factor}px, ${(mousePos.y - 0.5) * factor}px)`,
    transition: "transform 0.15s ease-out",
  } as React.CSSProperties);

  return (
    <div className="min-h-screen bg-[#060d1a] text-white font-sans overflow-x-hidden selection:bg-[#2563eb]/30 selection:text-white">
     
      {/* Cursor glow */}
      <div
        className="fixed pointer-events-none z-[9999] w-[400px] h-[400px] rounded-full blur-3xl opacity-[0.06] hidden md:block"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.5), transparent)",
          left: `${mousePos.x * 100}%`,
          top: `${mousePos.y * 100}%`,
          transform: "translate(-50%, -50%)",
          transition: "left 0.3s ease, top 0.3s ease",
        }}
      />

     
            {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#060d1a]/70 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
            : "bg-gradient-to-b from-[#060d1a]/60 to-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 h-18 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="INGSET" className="h-9 w-auto" />
            <div className="hidden sm:block">
              <div className="text-xl font-black tracking-tight bg-gradient-to-r from-[#2563eb] to-[#3B82F6] bg-clip-text text-transparent">
                INGSET
              </div>
              <div className="text-[9px] text-[#2563eb]/50 tracking-[0.25em] leading-tight -mt-0.5 uppercase">
                Monitoreo & Tecnología
              </div>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-white/50 hover:text-[#2563eb] transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-[#2563eb] after:to-[#3B82F6] after:transition-all after:duration-300 hover:after:w-full py-1"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
                        <button
              onClick={() => onNavigate("login")}
              className="relative px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563eb] text-[#060d1a] shadow-lg shadow-[#2563eb]/25 hover:shadow-[#2563eb]/40 transition-all duration-300 active:scale-95 overflow-hidden group"
            >
              <span className="relative z-10">Ingresar</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] to-[#2563eb] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2"
              aria-label="Menu"
            >
              <span className={`block w-6 h-[2px] bg-white/60 rounded transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[4.5px] bg-[#2563eb]" : ""}`} />
              <span className={`block w-6 h-[2px] bg-white/60 rounded transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block w-6 h-[2px] bg-white/60 rounded transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[4.5px] bg-[#2563eb]" : ""}`} />
            </button>
          </div>
        </div>

        <div className={`md:hidden overflow-hidden transition-all duration-400 ${mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="px-6 py-5 bg-[#060d1a]/90 backdrop-blur-2xl border-t border-white/5 flex flex-col gap-4">
                        {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className="text-sm text-white/50 hover:text-[#2563eb] transition-colors py-1">
                {l.label}
              </a>
            ))}
            <button
              onClick={() => { setMobileOpen(false); onNavigate("login"); }}
              className="text-sm text-[#2563eb] font-semibold hover:text-[#3B82F6] transition-colors py-1 text-left"
            >
              Ingresar
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32">
        {/* Moving background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#060d1a]/70 via-[#060d1a]/50 to-[#060d1a]" />
          <img
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop"
            alt=""
            className="w-full h-full object-cover animate-ken-burns"
          />
        </div>
        <GlowOrb className="w-[600px] h-[600px] bg-[#2563eb]/10 -top-40 -right-40" />
        <GlowOrb className="w-[500px] h-[500px] bg-[#0A1F4A]/30 -bottom-20 -left-20" />
        <GlowOrb className="w-[350px] h-[350px] bg-[#2563eb]/8 top-1/3 left-1/4" />

        <Particles colors={["rgba(37,99,235,0.5)", "rgba(10,31,74,0.4)", "rgba(59,130,246,0.3)"]} />

        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
              transform: "perspective(800px) rotateX(60deg)",
              transformOrigin: "center top",
            }}
          />
        </div>

        <div className="relative z-10 w-full px-5 pt-20 pb-24">
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
            <div style={parallax(8)}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full 
                bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] 
                text-xs text-[#2563eb]/80 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563eb] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563eb]" />
                </span>
                Monitoreo estructural con IoT
              </div>
            </div>

            <div style={parallax(-12)}>
              <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black tracking-tight leading-[0.85] mb-4">
                <span className="bg-gradient-to-r from-white via-[#2563eb] to-[#3B82F6] bg-clip-text text-transparent">
                  INGSET
                </span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-white/40 font-light tracking-wide max-w-xl mx-auto mb-8">
                Monitoreo inteligente de vigas con MPU9250 + VL53L01X + ESP32.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center" style={parallax(5)}>
              <a
                href="#caracteristicas"
                className="group relative px-8 py-3.5 text-base font-semibold rounded-2xl 
                  bg-gradient-to-r from-white to-[#e5e7eb] text-[#060d1a]
                  shadow-xl shadow-white/10 hover:shadow-white/20
                  active:scale-[0.97] transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2 text-[#060d1a]">
                  Conocer el proyecto
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#f3f4f6] to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a
                href="#resultados"
                className="group px-8 py-3.5 text-base font-medium rounded-2xl 
                  bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] 
                  text-white/60 hover:text-white hover:border-white/[0.15] 
                  hover:bg-white/[0.06] active:scale-[0.97] transition-all duration-300 
                  flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
              >
                <span>Ver resultados</span>
                <svg className="w-4 h-4 group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#060d1a] to-transparent" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="w-5 h-8 rounded-full border border-white/[0.08] flex items-start justify-center p-1
            bg-white/[0.02] backdrop-blur-sm">
            <div className="w-1 h-2 rounded-full bg-[#2563eb]/50 animate-scroll-dot" />
          </div>
        </div>
      </section>

      {/* ═══════════════ ABOUT ═══════════════ */}
      <section className="relative py-32 px-5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060d1a] via-[#081428] to-[#060d1a]" />
        <GlowOrb className="w-[400px] h-[400px] bg-[#0A1F4A]/40 left-10 top-1/4" />
        <GlowOrb className="w-[300px] h-[300px] bg-[#2563eb]/8 right-10 bottom-1/4" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full 
                bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] 
                text-xs text-[#2563eb]/70 mb-5 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-glow-pulse" />
                Sobre el Proyecto
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
                <span className="bg-gradient-to-r from-white via-[#2563eb]/80 to-white/60 bg-clip-text text-transparent">
                  Monitoreo estructural inteligente.
                </span>
              </h2>
              <p className="text-white/40 text-sm sm:text-base leading-relaxed mb-6">
                Este proyecto integra dos sensores de alta precisión —<strong className="text-white/60"> MPU9250</strong> (acelerómetro, giroscopio, magnetómetro) 
                y <strong className="text-white/60">VL53L01X</strong> (distancia láser ToF)— junto con un módulo <strong className="text-white/60">ESP32</strong> para 
                monitorear en tiempo real el comportamiento estructural de una viga. 
                Los datos se procesan y visualizan en un dashboard web interactivo.
              </p>
              <p className="text-white/30 text-sm sm:text-base leading-relaxed mb-8">
                El sistema detecta vibraciones, cambios de inclinación, desplazamientos 
                y deformaciones, permitiendo evaluar la integridad estructural de forma 
                remota y continua. Ideal para aplicaciones en ingeniería civil, 
                construcción y mantenimiento de infraestructura.
              </p>

              {/* Glassmorphism stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { num: "MPU9250", label: "9 Ejes" },
                  { num: "VL53L01X", label: "Láser ToF" },
                  { num: "ESP32", label: "WiFi + BLE" },
                ].map((s, i) => (
                  <div key={i} className="text-center p-4 rounded-xl 
                    bg-white/[0.03] backdrop-blur-md border border-white/[0.06]
                    hover:bg-white/[0.05] hover:border-[#2563eb]/20 transition-all duration-300">
                    <div className="text-sm font-black text-[#2563eb]">{s.num}</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Glassmorphism image card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#2563eb]/20 to-[#0A1F4A]/30 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden 
                bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]
                shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
                <img
                  src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop"
                  alt="INGSET - Sistema de monitoreo"
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060d1a]/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="w-12 h-1 rounded-full bg-gradient-to-r from-[#2563eb] to-[#3B82F6] mb-3" />
                  <h3 className="text-lg font-bold text-white">MPU9250 + VL53L01X + ESP32</h3>
                  <p className="text-sm text-white/40">Dos sensores. Una plataforma.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CARACTERÍSTICAS ═══════════════ */}
      <section id="caracteristicas" className="relative py-32 px-5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060d1a] via-[#060d1a] to-[#081428]" />
        <GlowOrb className="w-[500px] h-[500px] bg-[#2563eb]/8 left-1/3 top-1/4" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full 
              bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] 
              text-xs text-[#2563eb]/70 mb-5 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-glow-pulse" />
              Componentes y Funcionalidades
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-[#2563eb]/70 to-white/60 bg-clip-text text-transparent">
                Características
              </span>
            </h2>
            <p className="max-w-xl mx-auto text-white/30 text-sm">
              Hardware y software integrados para monitoreo estructural avanzado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {characteristics.map((s, i) => (
              <div
                key={i}
                className="group relative rounded-2xl overflow-hidden 
                  bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] 
                  hover:border-[#2563eb]/25 hover:bg-white/[0.05]
                  shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_40px_rgba(37,99,235,0.08)]
                  transition-all duration-500 hover:-translate-y-2"
              >
                {/* Background image on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <img src={s.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#060d1a]/80 backdrop-blur-sm" />
                </div>

                <div className="relative z-10 p-7">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{s.icon}</div>
                  <div className="w-8 h-0.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#3B82F6] mb-3 
                    group-hover:w-12 transition-all duration-300" />
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#2563eb] transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-sm text-white/30 group-hover:text-white/50 transition-colors">{s.desc}</p>
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[50px] border-r-[50px] border-t-[#2563eb]/20 border-r-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="relative py-24 px-5">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=600&fit=crop"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#060d1a]/80 backdrop-blur-sm" />
        </div>
        <GlowOrb className="w-[400px] h-[400px] bg-[#2563eb]/10 left-1/3 top-1/3" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {highlights.map((s, i) => (
              <div
                key={i}
                className="group text-center p-8 rounded-2xl 
                  bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] 
                  hover:border-[#2563eb]/20 hover:bg-white/[0.05] 
                  transition-all duration-500 hover:-translate-y-1
                  shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
              >
                <div className="text-2xl mb-3">{s.icon}</div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-[#2563eb] to-[#3B82F6] bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  <CountUp end={s.value} suffix={s.suffix} />
                </div>
                <div className="text-xs text-white/30 mt-2 group-hover:text-white/50 transition-colors">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TEAM ═══════════════ */}
      <section id="equipo" className="relative py-32 px-5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060d1a] via-[#081428] to-[#060d1a]" />
        <GlowOrb className="w-[500px] h-[500px] bg-[#2563eb]/8 left-1/4 top-1/4" />
        <GlowOrb className="w-[350px] h-[350px] bg-[#0A1F4A]/30 right-1/4 bottom-1/4" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full 
              bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] 
              text-xs text-[#2563eb]/70 mb-5 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-glow-pulse" />
              Estudiantes de Ingeniería
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-[#2563eb]/70 to-white/60 bg-clip-text text-transparent">
                Nuestro Equipo
              </span>
            </h2>
            <p className="max-w-xl mx-auto text-white/30 text-sm">
              Estudiantes apasionados por la tecnología y la ingeniería civil, 
              desarrollando soluciones innovadoras para el monitoreo estructural.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
            {[
              {
                name: "Santillan Verde Yordin Jamer",
                role: "Estudiante de Ingeniería Civil",
                desc: "Responsable del diseño y montaje del sistema de sensores sobre la viga, calibración del MPU9250 y VL53L01X, y análisis de datos estructurales.",
                image: "/jumer.jpeg",
                bgImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=600&fit=crop",
                tags: ["MPU9250", "VL53L01X", "Estructuras"],
              },
              {
                name: "García Moreno Josep Junior",
                role: "Estudiante de Ingeniería Civil",
                desc: "Líder del desarrollo del dashboard web, visualización 3D de la viga, gráficos en tiempo real y experiencia de usuario.",
                image: "/foto2.jpeg",
                bgImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=600&fit=crop",
                tags: ["ESP32", "Telemetría", "IoT"],
              },
              {
                name: "Marcos Paulino Jeanz Miller",
                role: "Estudiante de Ingeniería Civil",
                desc: "Encargado de la integración del ESP32, comunicación WiFi, transmisión de datos a la nube y desarrollo del pipeline de telemetría.",
                image: "/foto3.jpeg",
                bgImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=600&fit=crop",
                tags: ["Dashboard", "3D", "UX"],
              },
            ].map((m, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl 
                  bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] 
                  hover:border-[#2563eb]/25
                  shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_50px_rgba(37,99,235,0.12)]
                  transition-all duration-500 hover:-translate-y-2"
              >
                {/* Background image with overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 scale-110 group-hover:scale-100">
                  <img src={m.bgImage} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#060d1a]/85 backdrop-blur-[2px]" />
                </div>

                <div className="relative z-10 p-10">
                  {/* Square image */}
                  <div className="relative mx-auto mb-8 w-52 h-52 sm:w-56 sm:h-56">
                    <div className="absolute -inset-3 bg-gradient-to-br from-[#2563eb]/30 to-[#0A1F4A]/30 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                    <img
                      src={m.image}
                      alt={m.name}
                      className="relative w-full h-full object-cover object-top rounded-xl border-2 border-white/[0.08] 
                        group-hover:border-[#2563eb]/40 group-hover:scale-[1.02] transition-all duration-500"
                    />
                    {/* Glow corner */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#2563eb]/40 rounded-bl-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#2563eb]/30 to-transparent" />
                    <div className="w-10 h-1 rounded-full bg-gradient-to-r from-[#2563eb] to-[#3B82F6] group-hover:w-14 transition-all duration-300" />
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#2563eb]/30 to-transparent" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-1.5 text-center leading-tight">
                    {m.name}
                  </h3>
                  <p className="text-sm text-[#2563eb]/60 uppercase tracking-wider mb-5 text-center font-semibold">{m.role}</p>
                  <p className="text-base text-white/30 group-hover:text-white/50 transition-colors leading-relaxed text-center min-h-[90px]">
                    {m.desc}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2.5 mt-6 justify-center">
                    {m.tags.map((t, j) => (
                      <span
                        key={j}
                        className="px-4 py-1.5 text-sm font-medium tracking-wider rounded-lg
                          bg-white/[0.06] border border-white/[0.12] text-white/70
                          group-hover:bg-white/[0.10] group-hover:border-white/[0.20] group-hover:text-white/90
                          transition-all duration-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ RESULTS ═══════════════ */}
      <section id="resultados" className="relative py-32 px-5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060d1a] via-[#081428] to-[#060d1a]" />
        <GlowOrb className="w-[450px] h-[450px] bg-[#0A1F4A]/30 right-1/4 top-1/4" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full 
              bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] 
              text-xs text-[#2563eb]/70 mb-5 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-glow-pulse" />
              Evidencias
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-[#2563eb]/70 to-white/60 bg-clip-text text-transparent">
                Resultados
              </span>
            </h2>
            <p className="max-w-xl mx-auto text-white/30 text-sm">
              Capturas y evidencias del sistema en funcionamiento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Dashboard en Tiempo Real",
                category: "Visualización",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
              },
              {
                title: "Vista 3D de la Viga",
                category: "Modelado",
                image: "/modelo3d.png",
              },
              {
                title: "Gráficas de Sensores",
                category: "Telemetría",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
              },
              {
                title: "Montaje Electrónico",
                category: "Hardware",
                image: "/arduino.jpg",
              },
              {
                title: "Circuito MPU9250 + VL53L01X",
                category: "Sensores",
                image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=600&h=400&fit=crop",
              },
              {
                title: "ESP32 Transmisión",
                category: "Comunicación",
                image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop",
              },
            ].map((p, i) => (
              <div
                key={i}
                className="group relative rounded-2xl overflow-hidden 
                  border border-white/[0.06] hover:border-[#2563eb]/30 
                  transition-all duration-500 hover:-translate-y-1.5
                  shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-[1deg]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060d1a] via-[#060d1a]/50 to-transparent" />
                </div>

                {/* Glassmorphism overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6
                  bg-gradient-to-t from-[#060d1a]/90 via-[#060d1a]/40 to-transparent">
                  <div className="inline-block px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-semibold
                    bg-[#2563eb]/10 backdrop-blur-md border border-[#2563eb]/20 text-[#2563eb]/80 mb-2">
                    {p.category}
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#2563eb] transition-colors">
                    {p.title}
                  </h3>
                </div>

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute top-0 -left-20 w-40 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[20deg] group-hover:animate-shine" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section id="contacto" className="relative py-32 px-5">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1920&h=800&fit=crop"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060d1a]/90 via-[#060d1a]/70 to-[#060d1a]/90 backdrop-blur-[2px]" />
        </div>
        <GlowOrb className="w-[500px] h-[500px] bg-[#2563eb]/15 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        <GlowOrb className="w-[300px] h-[300px] bg-[#0A1F4A]/30 left-1/4 top-1/4" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full 
            bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] 
            text-xs text-[#2563eb]/70 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-glow-pulse" />
            Contacto
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-5">
            <span className="bg-gradient-to-r from-white via-[#2563eb]/80 to-[#2563eb] bg-clip-text text-transparent">
              ¿Interesado en el proyecto?
            </span>
          </h2>
          <p className="text-white/40 text-sm sm:text-base mb-10 max-w-lg mx-auto">
            Conoce más sobre nuestro sistema de monitoreo estructural con IoT.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:proyecto@viga.pe"
              className="group relative px-10 py-4 text-base font-semibold rounded-2xl 
                bg-gradient-to-r from-[#2563eb] to-[#1D4ED8] text-[#060d1a] 
                shadow-2xl shadow-[#2563eb]/25 hover:shadow-[#2563eb]/40 
                active:scale-[0.97] transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                proyecto@viga.pe
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] to-[#2563eb] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>
            <a
              href="#"
              className="group px-10 py-4 text-base font-medium rounded-2xl 
                bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] 
                text-white/60 hover:text-white hover:border-white/[0.15] 
                hover:bg-white/[0.06] active:scale-[0.97] transition-all duration-300
                shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
            >
              <span className="flex items-center gap-2">
                Ver demo
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </a>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[11px] text-white/20">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#2563eb]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              proyecto@viga.pe
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#2563eb]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Universidad
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#2563eb]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Proyecto académico
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="relative border-t border-white/[0.04] bg-[#060d1a]">
        <div className="max-w-7xl mx-auto px-5 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <svg className="h-10 w-10" viewBox="0 0 32 32" fill="none">
                  <rect x="2" y="2" width="28" height="28" rx="6" stroke="url(#fGrad)" strokeWidth="2.5" />
                  <path d="M10 22V10h4l4 8 4-8h4v12h-3V15l-4 7h-2l-4-7v7h-3z" fill="url(#fGrad)" />
                  <defs>
                    <linearGradient id="fGrad" x1="4" y1="4" x2="28" y2="28">
                      <stop stopColor="#2563eb" />
                      <stop offset="1" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div>
                  <div className="text-xl font-black bg-gradient-to-r from-[#2563eb] to-[#3B82F6] bg-clip-text text-transparent">INGSET</div>
                  <div className="text-[8px] text-[#2563eb]/50 tracking-[0.25em] uppercase">Monitoreo & Tecnología</div>
                </div>
              </div>
              <p className="text-xs text-white/20 leading-relaxed max-w-xs mb-4">
                Monitoreo estructural inteligente con sensores IoT.
              </p>
              <div className="flex gap-2">
                {[
                  { icon: "🔗", href: "#" },
                  { icon: "💼", href: "#" },
                  { icon: "📷", href: "#" },
                  { icon: "🐦", href: "#" },
                ].map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] 
                      flex items-center justify-center text-xs text-white/30 
                      hover:text-[#2563eb] hover:border-[#2563eb]/30 hover:bg-[#2563eb]/5 
                      transition-all"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {[
              {
                title: "Tecnología",
                links: [
                  { label: "MPU9250", href: "#" },
                  { label: "VL53L01X", href: "#" },
                  { label: "ESP32", href: "#" },
                  { label: "Dashboard", href: "#" },
                  { label: "API", href: "#" },
                ],
              },
              {
                title: "Equipo",
                links: [
                  { label: "Integrantes", href: "#equipo" },
                  { label: "Proyecto", href: "#" },
                  { label: "Resultados", href: "#resultados" },
                  { label: "Repo", href: "#" },
                  { label: "Contacto", href: "#contacto" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "Privacidad", href: "#" },
                  { label: "Términos", href: "#" },
                  { label: "Código Abierto", href: "#" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href={link.href} className="text-sm text-white/20 hover:text-[#2563eb]/70 transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/[0.03] gap-4">
            <div className="text-xs text-white/15">
              &copy; {new Date().getFullYear()} INGSET. Proyecto académico.
            </div>
            <div className="flex items-center gap-4 text-xs text-white/15">
              <span>Monitoreo & Tecnología</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Hecho con 💫</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
