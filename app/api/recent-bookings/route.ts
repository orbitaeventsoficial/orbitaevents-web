// app/api/recent-bookings/route.ts
// API per obtenir reserves recents per a les notificacions en viu

import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// Forçar ruta dinàmica (no s'executa durant el build)
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache 1 minut per reduir egress

export async function GET() {
  try {
    // Buscar reserves recents (últims 7 dies) que estiguin confirmades
    const recentBookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'PREPARING', 'COMPLETED']
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últims 7 dies
        }
      },
      select: {
        id: true,
        clientName: true,
        eventType: true,
        eventLocation: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Si no hi ha reserves reals, buscar LiveNotifications
    if (recentBookings.length === 0) {
      const liveNotifications = await prisma.liveNotification.findMany({
        where: {
          expiresAt: {
            gte: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      if (liveNotifications.length > 0) {
        return NextResponse.json({
          bookings: liveNotifications.map(n => ({
            id: n.id,
            name: getAnonymousName(n.type),
            city: n.location,
            service: getServiceName(n.type),
            icon: getIconForType(n.type),
            timeAgo: getTimeAgo(n.createdAt),
            isReal: n.isReal
          }))
        });
      }
    }

    // Formatar reserves reals
    const formattedBookings = recentBookings.map(booking => ({
      id: booking.id,
      name: anonymizeName(booking.clientName),
      city: extractCity(booking.eventLocation),
      service: getServiceName(booking.eventType),
      icon: getIconForType(booking.eventType),
      timeAgo: getTimeAgo(booking.createdAt),
      isReal: true
    }));

    return NextResponse.json({ bookings: formattedBookings });
  } catch (error) {
    log.error('Error fetching recent bookings:', error);
    return NextResponse.json({ bookings: [] });
  }
}

// Funcions auxiliars

function anonymizeName(name: string): string {
  // "Joan García" -> "Joan G."
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0)}.`;
}

function getAnonymousName(eventType: string): string {
  const names: Record<string, string[]> = {
    WEDDING: ['Marc & Laura', 'Pau & Maria', 'Joan & Anna', 'Albert & Carla'],
    BIRTHDAY: ['Sara', 'Marc', 'Laura', 'Pol', 'Maria'],
    CORPORATE: ['Empresa Tech', 'Start-up BCN', 'Consulting SL'],
    PRIVATE_PARTY: ['Marc', 'Laura', 'Joan', 'Anna'],
    COMMUNION: ['Família García', 'Família López'],
    BAPTISM: ['Família Martí', 'Família Puig'],
    OTHER: ['Client VIP', 'Reserva especial']
  };
  const options = names[eventType] || names.OTHER;
  return options[Math.floor(Math.random() * options.length)];
}

function extractCity(location: string): string {
  // Extreure ciutat de la ubicació
  if (!location) return 'Catalunya';
  const cities = ['Barcelona', 'Girona', 'Granollers', 'Mataró', 'Terrassa', 'Sabadell', 'Vic', 'Blanes', 'Lloret'];
  for (const city of cities) {
    if (location.toLowerCase().includes(city.toLowerCase())) {
      return city;
    }
  }
  return location.split(',')[0].trim();
}

function getServiceName(eventType: string): string {
  const services: Record<string, string> = {
    WEDDING: 'DJ + Producció Boda',
    BIRTHDAY: 'Festa Aniversari',
    CORPORATE: 'Event Corporatiu',
    COMMUNION: 'Comunió',
    BAPTISM: 'Bateig',
    GRADUATION: 'Graduació',
    ANNIVERSARY: 'Aniversari',
    PRIVATE_PARTY: 'Festa Privada',
    OTHER: 'Event Especial'
  };
  return services[eventType] || 'Event Personalitzat';
}

function getIconForType(eventType: string): 'check' | 'sparkles' | 'heart' | 'building' {
  const icons: Record<string, 'check' | 'sparkles' | 'heart' | 'building'> = {
    WEDDING: 'heart',
    BIRTHDAY: 'sparkles',
    CORPORATE: 'building',
    COMMUNION: 'sparkles',
    BAPTISM: 'heart',
    GRADUATION: 'sparkles',
    ANNIVERSARY: 'heart',
    PRIVATE_PARTY: 'sparkles',
    OTHER: 'check'
  };
  return icons[eventType] || 'check';
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 5) return 'Ara mateix';
  if (diffMins < 60) return `Fa ${diffMins} min`;
  if (diffHours < 24) return `Fa ${diffHours}h`;
  if (diffDays === 1) return 'Ahir';
  if (diffDays < 7) return `Fa ${diffDays} dies`;
  return 'Aquesta setmana';
}
