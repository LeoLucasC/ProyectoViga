import { useState, useEffect, useCallback, useRef } from "react";
import { Plus } from "lucide-react";
import { getSensors, toggleSensor, deleteSensor } from "../services/api";
import { SensorCard } from "./SensorCard";
import { AddSensorModal } from "./AddSensorModal";
import { EditSensorModal } from "./EditSensorModal";
import type { SensorResponse } from "../types/telemetry";

export function SensoresTab() {
  const [sensors, setSensors] = useState<SensorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSensor, setEditingSensor] = useState<SensorResponse | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSensors = useCallback(async () => {
    try {
      const data = await getSensors();
      setSensors(data);
    } catch {
      // silent — keep last known data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSensors();
    intervalRef.current = setInterval(fetchSensors, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchSensors]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSensor(id);
      fetchSensors();
    } catch {
      // ignore
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleSensor(id);
      fetchSensors();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return <p className="text-surface-400 text-sm">Cargando sensores...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-surface-400 text-xs">
          {sensors.length} sensor(es) registrado(s)
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
        >
          <Plus size={14} />
          Agregar Sensor
        </button>
      </div>

      {sensors.length === 0 ? (
        <div className="text-surface-500 text-sm text-center py-12">
          No hay sensores registrados. ¡Agrega tu primer sensor!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sensors.map((s) => (
            <SensorCard
              key={s.sensor_id}
              sensor={s}
              onToggle={handleToggle}
              onEdit={setEditingSensor}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddSensorModal
          onClose={() => setShowAddModal(false)}
          onCreated={fetchSensors}
        />
      )}

      {editingSensor && (
        <EditSensorModal
          sensor={editingSensor}
          onClose={() => setEditingSensor(null)}
          onUpdated={fetchSensors}
        />
      )}
    </div>
  );
}
