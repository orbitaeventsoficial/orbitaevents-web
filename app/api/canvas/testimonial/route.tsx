/**
 * API ROUTE: Canvas Generator
 * Genera imatges de testimonis per compartir a xarxes socials
 *
 * Utilitza @vercel/og (Vercel OG Image Generation)
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { CANVAS_PRESETS, translateEventType } from '@/lib/services/canvasService';
import { getInitials, getFirstName } from '@/lib/utils/normalize';
import { log } from '@/lib/logger';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Obtenir paràmetres
    const name = searchParams.get('name') || 'Client';
    const text = searchParams.get('text') || 'Gràcies per confiar en nosaltres!';
    const rating = parseInt(searchParams.get('rating') || '5');
    const code = searchParams.get('code') || 'ORBITA10';
    const discount = searchParams.get('discount') || '10';
    const eventType = searchParams.get('eventType');
    const preset = (searchParams.get('preset') || 'instagramStory') as keyof typeof CANVAS_PRESETS;

    // Obtenir configuració del preset
    const config = CANVAS_PRESETS[preset] || CANVAS_PRESETS.instagramStory;
    const { width, height, backgroundColor, accentColor, textColor } = config;

    // Processar dades
    const firstName = getFirstName(name);
    const initials = getInitials(name);

    // Truncar text si és massa llarg
    const maxTextLength = height > 1200 ? 250 : 120;
    const truncatedText = text.length > maxTextLength
      ? text.slice(0, maxTextLength) + '...'
      : text;

    // Generar estrelles
    const stars = Array(5)
      .fill(null)
      .map((_, i) => (i < rating ? '★' : '☆'))
      .join(' ');

    // Estils dinàmics segons preset
    const isStory = height > width;
    const baseFontSize = isStory ? 1 : 0.7;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: `linear-gradient(180deg, ${backgroundColor} 0%, #1a1a1a 100%)`,
            padding: isStory ? '60px' : '40px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: isStory ? '40px' : '20px',
            }}
          >
            <span
              style={{
                fontSize: `${48 * baseFontSize}px`,
                fontWeight: 800,
                color: textColor,
              }}
            >
              ÒRBITA
            </span>
            <span
              style={{
                fontSize: `${48 * baseFontSize}px`,
                fontWeight: 300,
                color: accentColor,
                marginLeft: '12px',
              }}
            >
              EVENTS
            </span>
          </div>

          {/* Avatar / Inicials */}
          <div
            style={{
              width: `${120 * baseFontSize}px`,
              height: `${120 * baseFontSize}px`,
              borderRadius: '50%',
              background: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: isStory ? '30px' : '15px',
            }}
          >
            <span
              style={{
                fontSize: `${48 * baseFontSize}px`,
                fontWeight: 700,
                color: textColor,
              }}
            >
              {initials}
            </span>
          </div>

          {/* Nom */}
          <div
            style={{
              fontSize: `${36 * baseFontSize}px`,
              fontWeight: 600,
              color: textColor,
              marginBottom: isStory ? '20px' : '10px',
            }}
          >
            {firstName}
          </div>

          {/* Tipus d'event */}
          {eventType && (
            <div
              style={{
                fontSize: `${20 * baseFontSize}px`,
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: isStory ? '15px' : '10px',
              }}
            >
              {translateEventType(eventType)}
            </div>
          )}

          {/* Estrelles */}
          <div
            style={{
              fontSize: `${40 * baseFontSize}px`,
              color: accentColor,
              marginBottom: isStory ? '40px' : '20px',
              letterSpacing: '8px',
            }}
          >
            {stars}
          </div>

          {/* Testimoni */}
          <div
            style={{
              fontSize: `${28 * baseFontSize}px`,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.6,
              maxWidth: '90%',
              marginBottom: isStory ? '60px' : '30px',
              fontStyle: 'italic',
            }}
          >
            "{truncatedText}"
          </div>

          {/* Separador */}
          <div
            style={{
              width: `${100 * baseFontSize}px`,
              height: '4px',
              background: accentColor,
              marginBottom: isStory ? '60px' : '30px',
            }}
          />

          {/* Codi de descompte */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(249, 115, 22, 0.1)',
              border: `2px solid ${accentColor}`,
              borderRadius: '20px',
              padding: isStory ? '30px 50px' : '20px 40px',
            }}
          >
            <span
              style={{
                fontSize: `${24 * baseFontSize}px`,
                color: textColor,
                marginBottom: '10px',
              }}
            >
              El teu codi de descompte
            </span>
            <span
              style={{
                fontSize: `${48 * baseFontSize}px`,
                fontWeight: 800,
                color: accentColor,
                letterSpacing: '4px',
              }}
            >
              {code}
            </span>
            <span
              style={{
                fontSize: `${32 * baseFontSize}px`,
                fontWeight: 700,
                color: textColor,
                marginTop: '10px',
              }}
            >
              {discount}% OFF
            </span>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: isStory ? '40px' : '20px',
              fontSize: `${20 * baseFontSize}px`,
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            www.orbitaevents.com
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    );
  } catch (error: unknown) {
    log.error('Failed to generate canvas', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error generating image: ${message}`, {
      status: 500,
    });
  }
}
