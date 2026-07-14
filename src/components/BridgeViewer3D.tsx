import { Suspense, useRef, useCallback, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

import {
  OrbitControls,
  Environment,
  ContactShadows,
  useGLTF,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { Box, RotateCw, ZoomIn } from "lucide-react";
import type { SensorResponse } from "../types/telemetry";
import { parseSensorCoords } from "../utils/format";

/* ---------------------------------------------------------- */
/*  Props del scene compartido                                */
/* ---------------------------------------------------------- */
export interface BridgeSceneProps {
  glbUrl?: string;
  selectable?: boolean;
  selectedPosition?: [number, number, number] | null;
  onPositionSelect?: (x: number, y: number, z: number) => void;
  autoRotate?: boolean;
  sensors?: SensorResponse[];
}

/* ---------------------------------------------------------- */
/*  Sensor marker con ondas animadas                          */
/* ---------------------------------------------------------- */
function SensorMarker3D({
  position,
  nombre,
  sensorId,
}: {
  position: [number, number, number];
  nombre: string | null;
  sensorId: string;
}) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const phase = useRef(Math.random() * Math.PI * 2);

  const color = "#ef4444";

  useFrame((_, delta) => {
    phase.current += delta * 2.5;
    // Sphere pulse
    if (sphereRef.current) {
      const s = 1 + Math.sin(phase.current) * 0.15;
      sphereRef.current.scale.setScalar(s);
    }
    // Expanding ring
    if (ringRef.current) {
      const t = (Math.sin(phase.current) + 1) / 2; // 0..1
      const r = 0.08 + t * 0.25;
      ringRef.current.scale.setScalar(1 + t * 3);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - t;
    }
  });

  return (
    <group position={position}>
      {/* Wave ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.06, 0.1, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Core sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>

      {/* Glow halo */}
      <mesh>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      {/* Tooltip */}
      <Html distanceFactor={1} center className="pointer-events-none">
        <div className="bg-surface-900/80 backdrop-blur-sm px-2 py-1 rounded border border-surface-700 text-[10px] text-surface-200 font-mono whitespace-nowrap -translate-y-4">
          {nombre || sensorId}
        </div>
      </Html>
    </group>
  );
}

/* ---------------------------------------------------------- */
/*  Marker de posicion seleccionada                           */
/* ---------------------------------------------------------- */
function PositionMarker({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.05, 0.12, 24]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <Html distanceFactor={0.8} center className="pointer-events-none">
        <div className="bg-surface-900/90 backdrop-blur-sm px-2 py-1 rounded border border-surface-700 text-[10px] text-surface-200 font-mono whitespace-nowrap">
          x: {position[0].toFixed(2)} y: {position[1].toFixed(2)} z: {position[2].toFixed(2)}
        </div>
      </Html>
    </group>
  );
}

/* ---------------------------------------------------------- */
/*  Fallback: puente parametrico (sin GLB)                    */
/* ---------------------------------------------------------- */
function ProceduralBridge({
  selectable,
  onMeshClick,
}: {
  selectable?: boolean;
  onMeshClick?: (point: THREE.Vector3) => void;
}) {
  const handleClick = useCallback(
    (e: any) => {
      if (selectable && onMeshClick) {
        e.stopPropagation();
        onMeshClick(e.point);
      }
    },
    [selectable, onMeshClick]
  );

  const beamColor = new THREE.Color("#60a5fa");
  const cableColor = new THREE.Color("#94a3b8");
  const deckColor = new THREE.Color("#1e293b");

  return (
    <group>
      <mesh position={[0, 0, 0]} castShadow receiveShadow onClick={handleClick}>
        <boxGeometry args={[5, 0.15, 1.2]} />
        <meshStandardMaterial color={deckColor} metalness={0.3} roughness={0.7} />
      </mesh>
      {[-0.55, 0.55].map((z) => (
        <mesh key={z} position={[0, 0.4, z]} castShadow onClick={handleClick}>
          <boxGeometry args={[4.6, 0.6, 0.1]} />
          <meshStandardMaterial color={beamColor} metalness={0.6} roughness={0.2} />
        </mesh>
      ))}
      {[-2.2, 2.2].map((x) => (
        <group key={x}>
          <mesh position={[x, -0.8, -0.6]} castShadow onClick={handleClick}>
            <boxGeometry args={[0.25, 1.3, 0.25]} />
            <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.6} />
          </mesh>
          <mesh position={[x, -0.8, 0.6]} castShadow onClick={handleClick}>
            <boxGeometry args={[0.25, 1.3, 0.25]} />
            <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {[-1.4, 0, 1.4].map((x, i) => {
        const height = 0.8 + Math.abs(x) * 0.15;
        return (
          <group key={`cable-${i}`}>
            <mesh position={[x, height, -0.55]} onClick={handleClick}>
              <cylinderGeometry args={[0.015, 0.015, height * 2]} />
              <meshStandardMaterial color={cableColor} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[x, height, 0.55]} onClick={handleClick}>
              <cylinderGeometry args={[0.015, 0.015, height * 2]} />
              <meshStandardMaterial color={cableColor} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        );
      })}
      {[-0.55, 0.55].map((z) => (
        <mesh key={`arc-${z}`} position={[0, 1.0, z]} rotation={[0, 0, 0]} onClick={handleClick}>
          <torusGeometry args={[1.8, 0.04, 8, 20, Math.PI]} />
          <meshStandardMaterial color={beamColor} metalness={0.6} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------- */
/*  Modelo GLB con auto-escalado                              */
/* ---------------------------------------------------------- */
function GlbModel({
  url,
  selectable,
  onMeshClick,
}: {
  url: string;
  selectable?: boolean;
  onMeshClick?: (point: THREE.Vector3) => void;
}) {
  const { scene } = useGLTF(url);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    setScale(4 / maxDim);
  }, [scene]);

  const handlePointerDown = useCallback(
    (e: any) => {
      if (selectable && onMeshClick) {
        e.stopPropagation();
        onMeshClick(e.point);
      }
    },
    [selectable, onMeshClick]
  );

  return (
    <primitive
      object={scene}
      scale={scale}
      onClick={handlePointerDown}
      onPointerDown={handlePointerDown}
    />
  );
}

/* ---------------------------------------------------------- */
/*  Scene interior (compartido)                               */
/* ---------------------------------------------------------- */
function BridgeScene({
  glbUrl,
  selectable = false,
  selectedPosition,
  onPositionSelect,
  autoRotate = true,
  sensors,
}: BridgeSceneProps) {
  const hasGlb = !!glbUrl;

  const handleMeshClick = useCallback(
    (point: THREE.Vector3) => {
      onPositionSelect?.(point.x, point.y, point.z);
    },
    [onPositionSelect]
  );

  const sensorMarkers = useMemo(() => {
    if (!sensors) return null;
    return sensors
      .filter((s) => s.activo)
      .map((s) => {
        const pos = parseSensorCoords(s.ubicacion);
        if (!pos) return null;
        return <SensorMarker3D key={s.sensor_id} position={pos} nombre={s.nombre} sensorId={s.sensor_id} />;
      });
  }, [sensors]);

  const glbContent = hasGlb ? (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-3, 4, -2]} intensity={0.5} />
      <GlbModel url={glbUrl!} selectable={selectable} onMeshClick={handleMeshClick} />
      <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={8} blur={2} far={3} />
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={10}
        autoRotate={autoRotate}
        autoRotateSpeed={1}
      />
      <Environment preset="city" />
    </>
  ) : (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} />
      <pointLight position={[0, 3, 0]} intensity={0.3} color="#60a5fa" />
      <ProceduralBridge selectable={selectable} onMeshClick={handleMeshClick} />
      <ContactShadows position={[0, -1.2, 0]} opacity={0.5} scale={8} blur={2.5} far={3} />
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={8}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate={autoRotate}
        autoRotateSpeed={0.8}
      />
      <Environment preset="city" />
    </>
  );

  return (
    <>
      {glbContent}
      {selectedPosition && <PositionMarker position={selectedPosition} />}
      {sensorMarkers}
    </>
  );
}

/* ---------------------------------------------------------- */
/*  Componente publico — Dashboard                            */
/* ---------------------------------------------------------- */
export function BridgeViewer3D({
  glbUrl,
  sensors,
}: {
  glbUrl?: string;
  sensors?: SensorResponse[];
}) {
  return (
    <div className="bg-surface-900/80 backdrop-blur-sm rounded-xl border border-surface-800 overflow-hidden group">
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <Box size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold leading-tight">Modelo 3D de una Viga no confinada</h3>
            <p className="text-surface-500 text-[11px] leading-tight">Vista previa digital</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-surface-500">
          <ZoomIn size={14} className="transition-colors group-hover:text-surface-300" />
          <RotateCw size={14} className="transition-colors group-hover:text-surface-300" />
        </div>
      </div>

      <div className="h-[280px] w-full relative">
        <Canvas
          shadows
          camera={{ position: [4, 2.5, 4], fov: 35 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor(new THREE.Color("#12151f"));
          }}
        >
          <Suspense
            fallback={
              <Html center>
                <div className="flex flex-col items-center gap-2 text-surface-400">
                  <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Cargando modelo...</span>
                </div>
              </Html>
            }
          >
            <BridgeScene glbUrl={glbUrl} sensors={sensors} />
          </Suspense>
        </Canvas>

        <div className="absolute bottom-3 left-3 text-[10px] text-surface-600 font-mono pointer-events-none select-none">
          VigaMonitor · Digital Twin
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-surface-950/60 backdrop-blur-sm border border-surface-700 text-[10px] text-surface-400 font-mono pointer-events-none select-none">
          {glbUrl ? "GLB" : "PREVIEW"}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/*  Selector de posicion para modal                           */
/* ---------------------------------------------------------- */
export function SensorPositionPicker({
  glbUrl,
  selectedPosition,
  onPositionSelect,
}: {
  glbUrl?: string;
  selectedPosition?: [number, number, number] | null;
  onPositionSelect?: (x: number, y: number, z: number) => void;
}) {
  return (
    <div className="h-[240px] w-full rounded-lg overflow-hidden border border-surface-700 relative">
      <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-surface-950/70 backdrop-blur-sm border border-surface-700 text-[10px] text-surface-300 font-mono pointer-events-none">
        Click en el puente para ubicar
      </div>
      <Canvas
        shadows
        camera={{ position: [4, 2.5, 4], fov: 35 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#12151f"));
        }}
      >
        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-2 text-surface-400">
                <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Cargando modelo...</span>
              </div>
            </Html>
          }
        >
          <BridgeScene
            glbUrl={glbUrl}
            selectable
            autoRotate={false}
            selectedPosition={selectedPosition ?? undefined}
            onPositionSelect={onPositionSelect}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
