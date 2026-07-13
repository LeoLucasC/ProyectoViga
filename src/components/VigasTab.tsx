import { useState, useEffect, useCallback } from "react";
import {
  Building2, Plus, Pencil, Trash2, MapPin,
  RefreshCw, Loader2, X, Check,
} from "lucide-react";
import { getVigas, createViga, updateViga, deleteViga } from "../services/api";
import type { Viga } from "../types/telemetry";

export function VigasTab() {
  const [vigas, setVigas] = useState<Viga[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formNombre, setFormNombre] = useState("");
  const [formUbicacion, setFormUbicacion] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchVigas = useCallback(async () => {
    try {
      const data = await getVigas();
      setVigas(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVigas();
  }, [fetchVigas]);

  function resetForm() {
    setFormNombre("");
    setFormUbicacion("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(viga: Viga) {
    setEditingId(viga.viga_id);
    setFormNombre(viga.nombre);
    setFormUbicacion(viga.ubicacion);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formNombre.trim() || !formUbicacion.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateViga(editingId, { nombre: formNombre.trim(), ubicacion: formUbicacion.trim() });
      } else {
        await createViga({ nombre: formNombre.trim(), ubicacion: formUbicacion.trim() });
      }
      resetForm();
      await fetchVigas();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(vigaId: number) {
    setDeleting(vigaId);
    try {
      await deleteViga(vigaId);
      await fetchVigas();
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-surface-500">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-sm">Cargando vigas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-surface-400 text-sm">
          <Building2 size={16} />
          <span>{vigas.length} viga{vigas.length !== 1 ? "s" : ""} registrada{vigas.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchVigas}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Nueva Viga
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-surface-900/80 rounded-xl border border-surface-700 p-4 space-y-3">
          <input
            value={formNombre}
            onChange={(e) => setFormNombre(e.target.value)}
            placeholder="Nombre de la viga"
            className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 text-sm focus:outline-none focus:border-primary-500/50"
          />
          <input
            value={formUbicacion}
            onChange={(e) => setFormUbicacion(e.target.value)}
            placeholder="Ubicación"
            className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 text-sm focus:outline-none focus:border-primary-500/50"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !formNombre.trim() || !formUbicacion.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-success-500 hover:bg-success-600 disabled:opacity-50 rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {editingId ? "Guardar" : "Crear"}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-surface-300 bg-surface-800 hover:bg-surface-700 rounded-lg transition-colors"
            >
              <X size={14} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {vigas.length === 0 ? (
          <div className="text-center py-12 text-surface-500">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay vigas registradas</p>
          </div>
        ) : (
          vigas.map((viga) => (
            <div
              key={viga.viga_id}
              className="flex items-center justify-between p-4 rounded-xl bg-surface-900/50 border border-surface-800 hover:border-surface-700 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-primary-400" />
                </div>
                <div>
                  <h4 className="text-surface-200 font-medium text-sm">{viga.nombre}</h4>
                  <div className="flex items-center gap-1 text-surface-500 text-xs mt-0.5">
                    <MapPin size={11} />
                    {viga.ubicacion}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(viga)}
                  className="p-2 rounded-lg text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(viga.viga_id)}
                  disabled={deleting === viga.viga_id}
                  className="p-2 rounded-lg text-surface-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  {deleting === viga.viga_id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
