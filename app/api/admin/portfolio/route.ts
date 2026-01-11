// app/api/admin/portfolio/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'portfolio.images';

interface PortfolioImage {
  id: string;
  url: string;
  title: string;
  category: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

// GET - Obtener todas las imágenes del portfolio
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    let images: PortfolioImage[] = [];

    if (setting) {
      try {
        images = JSON.parse(setting.value);
      } catch (error) {
        log.error('Error parseando imágenes del portfolio:', error);
      }
    }

    // Ordenar por orden y fecha
    images.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return NextResponse.json({
      ok: true,
      images,
    });
  } catch (error) {
    log.error('Error obteniendo imágenes del portfolio:', error);
    return NextResponse.json(
      { ok: false, error: 'Error obteniendo imágenes del portfolio' },
      { status: 500 }
    );
  }
}

// POST - Gestionar imágenes del portfolio (add, delete, toggle)
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { action, id, url, title, category, description, order, isActive } = body;

    if (!action) {
      return NextResponse.json(
        { ok: false, error: 'Action es requerido' },
        { status: 400 }
      );
    }

    // Obtener imágenes actuales
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    let images: PortfolioImage[] = [];
    if (setting) {
      try {
        images = JSON.parse(setting.value);
      } catch (error) {
        log.error('Error parseando imágenes:', error);
      }
    }

    // Ejecutar acción
    switch (action) {
      case 'add': {
        if (!url || !title) {
          return NextResponse.json(
            { ok: false, error: 'URL y título son requeridos' },
            { status: 400 }
          );
        }

        const newImage: PortfolioImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url,
          title,
          category: category || 'otros',
          description: description || '',
          order: order || 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        images.push(newImage);
        break;
      }

      case 'delete': {
        if (!id) {
          return NextResponse.json(
            { ok: false, error: 'ID es requerido para eliminar' },
            { status: 400 }
          );
        }

        images = images.filter(img => img.id !== id);
        break;
      }

      case 'toggle': {
        if (!id || typeof isActive !== 'boolean') {
          return NextResponse.json(
            { ok: false, error: 'ID e isActive son requeridos' },
            { status: 400 }
          );
        }

        const image = images.find(img => img.id === id);
        if (image) {
          image.isActive = isActive;
        }
        break;
      }

      case 'update': {
        if (!id) {
          return NextResponse.json(
            { ok: false, error: 'ID es requerido para actualizar' },
            { status: 400 }
          );
        }

        const image = images.find(img => img.id === id);
        if (image) {
          if (url) image.url = url;
          if (title) image.title = title;
          if (category) image.category = category;
          if (description !== undefined) image.description = description;
          if (order !== undefined) image.order = order;
          if (isActive !== undefined) image.isActive = isActive;
        }
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
        value: JSON.stringify(images),
        type: 'JSON',
        category: 'config',
        label: 'Portfolio de Imágenes',
        description: 'Imágenes del portfolio público de Órbita Events',
      },
      update: {
        value: JSON.stringify(images),
      },
    });

    // Log del cambio
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'portfolio',
        entityId: id || SETTING_KEY,
        details: { action, url, title, category },
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Portfolio actualizado correctamente',
      images,
    });
  } catch (error) {
    log.error('Error actualizando portfolio:', error);
    return NextResponse.json(
      { ok: false, error: 'Error actualizando portfolio' },
      { status: 500 }
    );
  }
}
