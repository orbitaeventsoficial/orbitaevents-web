'use client';

import { useEffect, useState } from 'react';
import { log } from '@/lib/logger';

interface Equipment {
  id: string;
  name: string;
  category: string;
  quantity: number;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  description?: string;
  purchaseDate?: string;
  lastMaintenance?: string;
  notes?: string;
}

const CATEGORIES = [
  { value: 'sound', label: 'Sonido 🔊', color: 'purple' },
  { value: 'lighting', label: 'Iluminación 💡', color: 'yellow' },
  { value: 'effects', label: 'Efectos 🎆', color: 'pink' },
  { value: 'booth', label: 'Cabina 📸', color: 'blue' },
  { value: 'accessories', label: 'Accesorios 🎭', color: 'green' },
  { value: 'others', label: 'Otros 📦', color: 'slate' },
];

const STATUS_CONFIG = {
  available: { label: 'Disponible', color: 'green', icon: '✓' },
  in_use: { label: 'En uso', color: 'blue', icon: '⚙️' },
  maintenance: { label: 'Mantenimiento', color: 'orange', icon: '🔧' },
  retired: { label: 'Retirado', color: 'slate', icon: '🗑️' },
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'sound',
    quantity: 1,
    status: 'available' as Equipment['status'],
    description: '',
    purchaseDate: '',
    lastMaintenance: '',
    notes: '',
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const res = await fetch('/api/admin/equipment');
      const data = await res.json();
      if (data.ok) {
        setEquipment(data.equipment);
      }
    } catch (error) {
      log.error('Error cargando equipamiento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingId ? 'update' : 'add',
          id: editingId,
          ...formData,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadEquipment();
        resetForm();
      } else {
        alert(data.error || 'Error guardando equipo');
      }
    } catch (error) {
      log.error('Error guardando equipo:', error);
      alert('Error guardando equipo');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: Equipment) => {
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      status: item.status,
      description: item.description || '',
      purchaseDate: item.purchaseDate || '',
      lastMaintenance: item.lastMaintenance || '',
      notes: item.notes || '',
    });
    setEditingId(item.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este equipo del inventario?')) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadEquipment();
      } else {
        alert(data.error || 'Error eliminando equipo');
      }
    } catch (error) {
      log.error('Error eliminando equipo:', error);
      alert('Error eliminando equipo');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'sound',
      quantity: 1,
      status: 'available',
      description: '',
      purchaseDate: '',
      lastMaintenance: '',
      notes: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Cargando...</div>
      </div>
    );
  }

  const filteredEquipment = selectedCategory === 'all'
    ? equipment
    : equipment.filter(eq => eq.category === selectedCategory);

  const availableCount = equipment.filter(eq => eq.status === 'available').length;
  const totalQuantity = equipment.reduce((sum, eq) => sum + eq.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
            Equipment Manager
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona el inventario de equipamiento
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          className="inline-flex items-center rounded-md bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-rose-600 shadow-sm"
        >
          + Añadir Equipo
        </button>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Items</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">{equipment.length}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-blue-600 uppercase">Cantidad Total</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{totalQuantity}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase">Disponibles</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{availableCount}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-orange-600 uppercase">En Uso</p>
          <p className="mt-2 text-3xl font-bold text-orange-700">
            {equipment.filter(eq => eq.status === 'in_use').length}
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-slate-700 text-white'
              : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
          }`}
        >
          📦 Todos ({equipment.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = equipment.filter(eq => eq.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-slate-700 text-white'
                  : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </section>

      {/* Add/Edit Form */}
      {showAddForm && (
        <section className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            {editingId ? 'Editar Equipo' : 'Añadir Nuevo Equipo'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre del Equipo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                  placeholder="Speaker Pioneer XDJ-RX3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Equipment['status'] })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Último Mantenimiento
                </label>
                <input
                  type="date"
                  value={formData.lastMaintenance}
                  onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                rows={2}
                placeholder="Descripción del equipo..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                rows={2}
                placeholder="Notas adicionales..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center rounded-md bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-2.5 text-sm font-medium text-white hover:from-orange-600 hover:to-rose-600 shadow-sm disabled:opacity-50"
              >
                {editingId ? 'Actualizar' : 'Añadir'} Equipo
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center rounded-md bg-stone-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-stone-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Equipment List */}
      <section>
        {filteredEquipment.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-12 text-center">
            <span className="text-4xl">📦</span>
            <p className="mt-4 text-slate-600">
              {selectedCategory === 'all' ? 'No hay equipos en el inventario' : 'No hay equipos en esta categoría'}
            </p>
            <p className="text-sm text-slate-400">Añade el primer equipo para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEquipment.map(item => {
              const statusConfig = STATUS_CONFIG[item.status];
              const categoryConfig = CATEGORIES.find(c => c.value === item.category);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{categoryConfig?.label.split(' ')[1] || '📦'}</span>
                        <div>
                          <h3 className="font-semibold text-slate-700">{item.name}</h3>
                          <p className="text-xs text-slate-400">
                            {categoryConfig?.label.split(' ')[0]} • {item.quantity} unidad{item.quantity > 1 ? 'es' : ''}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-${statusConfig.color}-100 text-${statusConfig.color}-700`}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-sm text-slate-600 ml-11 mb-2">{item.description}</p>
                      )}

                      <div className="text-xs text-slate-500 ml-11 flex flex-wrap gap-x-4 gap-y-1">
                        {item.purchaseDate && (
                          <span>🛒 Compra: {new Date(item.purchaseDate).toLocaleDateString()}</span>
                        )}
                        {item.lastMaintenance && (
                          <span>🔧 Mantenimiento: {new Date(item.lastMaintenance).toLocaleDateString()}</span>
                        )}
                      </div>

                      {item.notes && (
                        <div className="mt-2 ml-11 text-xs text-slate-500 bg-slate-50 rounded p-2">
                          💬 {item.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEdit(item)}
                        disabled={saving}
                        className="inline-flex items-center rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={saving}
                        className="inline-flex items-center rounded-md bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
