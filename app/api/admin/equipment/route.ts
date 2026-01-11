// app/api/admin/equipment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'equipment.inventory';

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
  createdAt: string;
  updatedAt: string;
}

// GET - Obtener todo el equipamiento
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    let equipment: Equipment[] = [];

    if (setting) {
      try {
        equipment = JSON.parse(setting.value);
      } catch (error) {
        log.error('Error parseando equipamiento:', error);
      }
    }

    return NextResponse.json({
      ok: true,
      equipment,
    });
  } catch (error) {
    log.error('Error obteniendo equipamiento:', error);
    return NextResponse.json(
      { ok: false, error: 'Error obteniendo equipamiento' },
      { status: 500 }
    );
  }
}

// POST - Gestionar equipamiento (add, update, delete)
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { action, id, name, category, quantity, status, description, purchaseDate, lastMaintenance, notes } = body;

    if (!action) {
      return NextResponse.json(
        { ok: false, error: 'Action es requerido' },
        { status: 400 }
      );
    }

    // Obtener equipamiento actual
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    let equipment: Equipment[] = [];
    if (setting) {
      try {
        equipment = JSON.parse(setting.value);
      } catch (error) {
        log.error('Error parseando equipamiento:', error);
      }
    }

    // Ejecutar acción
    switch (action) {
      case 'add': {
        if (!name || !category) {
          return NextResponse.json(
            { ok: false, error: 'Nombre y categoría son requeridos' },
            { status: 400 }
          );
        }

        const newEquipment: Equipment = {
          id: `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          category,
          quantity: quantity || 1,
          status: status || 'available',
          description: description || '',
          purchaseDate: purchaseDate || '',
          lastMaintenance: lastMaintenance || '',
          notes: notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        equipment.push(newEquipment);
        break;
      }

      case 'update': {
        if (!id) {
          return NextResponse.json(
            { ok: false, error: 'ID es requerido para actualizar' },
            { status: 400 }
          );
        }

        const item = equipment.find(eq => eq.id === id);
        if (item) {
          if (name) item.name = name;
          if (category) item.category = category;
          if (quantity !== undefined) item.quantity = quantity;
          if (status) item.status = status;
          if (description !== undefined) item.description = description;
          if (purchaseDate !== undefined) item.purchaseDate = purchaseDate;
          if (lastMaintenance !== undefined) item.lastMaintenance = lastMaintenance;
          if (notes !== undefined) item.notes = notes;
          item.updatedAt = new Date().toISOString();
        } else {
          return NextResponse.json(
            { ok: false, error: 'Equipo no encontrado' },
            { status: 404 }
          );
        }
        break;
      }

      case 'delete': {
        if (!id) {
          return NextResponse.json(
            { ok: false, error: 'ID es requerido para eliminar' },
            { status: 400 }
          );
        }

        equipment = equipment.filter(eq => eq.id !== id);
        break;
      }

      default:
        return NextResponse.json(
          { ok: false, error: 'Acción no válida' },
          { status: 400 }
        );
    }

    // Guardar cambios
    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      create: {
        key: SETTING_KEY,
        value: JSON.stringify(equipment),
        type: 'JSON',
        category: 'config',
        label: 'Inventario de Equipamiento',
        description: 'Equipamiento y material de Órbita Events',
      },
      update: {
        value: JSON.stringify(equipment),
      },
    });

    // Log del cambio
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'equipment',
        entityId: id || SETTING_KEY,
        details: { action, name, category, status },
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Equipamiento actualizado correctamente',
      equipment,
    });
  } catch (error) {
    log.error('Error actualizando equipamiento:', error);
    return NextResponse.json(
      { ok: false, error: 'Error actualizando equipamiento' },
      { status: 500 }
    );
  }
}
