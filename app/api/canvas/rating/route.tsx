/**
 * API ROUTE: Canvas "10/10" Rating
 * =================================
 * Genera imatge de gratitud post-event amb:
 * - Degradat negre a daurat
 * - Rating gegant (10/10 o X/10)
 * - Nom del client
 * - Logo Òrbita Events
 * - Codi de descompte
 *
 * Utilitza @vercel/og (Vercel OG Image Generation)
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Presets de mida
const PRESETS = {
  instagramStory: { width: 1080, height: 1920 },
  instagramPost: { width: 1080, height: 1080 },
  whatsapp: { width: 800, height: 800 },
  email: { width: 600, height: 800 },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Obtenir paràmetres
    const name = searchParams.get('name') || 'Client';
    const rating = Math.min(10, Math.max(1, parseInt(searchParams.get('rating') || '10')));
    const code = searchParams.get('code') || 'ORBITA10';
    const discount = searchParams.get('discount') || '10';
    const preset = (searchParams.get('preset') || 'instagramStory') as keyof typeof PRESETS;
    const eventType = searchParams.get('eventType') || '';

    // Obtenir configuració del preset
    const { width, height } = PRESETS[preset] || PRESETS.instagramStory;
    const isStory = height > width;

    // Processar nom (primer nom o inicials)
    const firstName = name.split(' ')[0];

    // Calcular mides dinàmiques
    const scale = isStory ? 1 : 0.7;
    const ratingSize = isStory ? 280 : 180;
    const nameSize = isStory ? 48 : 32;
    const codeSize = isStory ? 56 : 40;

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
            background: 'linear-gradient(180deg, #000000 0%, #1a1a1a 30%, #2d1f00 70%, #3d2800 100%)',
            fontFamily: 'Inter, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Efecte de partícules daurades */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 50% 30%, rgba(255, 200, 0, 0.15) 0%, transparent 50%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '20%',
              right: '10%',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(255, 180, 0, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '30%',
              left: '5%',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(255, 200, 0, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />

          {/* Logo ÒRBITA EVENTS */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: isStory ? '40px' : '20px',
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontSize: `${52 * scale}px`,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '4px',
              }}
            >
              ÒRBITA
            </span>
            <span
              style={{
                fontSize: `${52 * scale}px`,
                fontWeight: 300,
                color: '#FFB800',
                marginLeft: '16px',
                letterSpacing: '4px',
              }}
            >
              EVENTS
            </span>
          </div>

          {/* Gràcies text */}
          <div
            style={{
              fontSize: `${28 * scale}px`,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: isStory ? '30px' : '15px',
              textTransform: 'uppercase',
              letterSpacing: '6px',
            }}
          >
            Gràcies per confiar en nosaltres
          </div>

          {/* RATING GEGANT - 10/10 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              marginBottom: isStory ? '40px' : '20px',
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontSize: `${ratingSize}px`,
                fontWeight: 900,
                background: 'linear-gradient(180deg, #FFD700 0%, #FFB800 50%, #CC9600 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 0 80px rgba(255, 200, 0, 0.5)',
                lineHeight: 1,
              }}
            >
              {rating}
            </span>
            <span
              style={{
                fontSize: `${ratingSize * 0.4}px`,
                fontWeight: 300,
                color: 'rgba(255, 255, 255, 0.5)',
                marginLeft: '10px',
              }}
            >
              /10
            </span>
          </div>

          {/* Estrelles (5 estrelles, equivalents al rating) */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: isStory ? '50px' : '25px',
            }}
          >
            {[1, 2, 3, 4, 5].map(star => {
              // Convertir rating de 10 a 5 estrelles
              const starRating = Math.ceil(rating / 2);
              const filled = star <= starRating;
              return (
                <span
                  key={star}
                  style={{
                    fontSize: `${40 * scale}px`,
                    color: filled ? '#FFB800' : 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  ★
                </span>
              );
            })}
          </div>

          {/* Nom del client */}
          <div
            style={{
              fontSize: `${nameSize}px`,
              fontWeight: 600,
              color: '#ffffff',
              marginBottom: isStory ? '15px' : '10px',
            }}
          >
            {firstName}
          </div>

          {/* Tipus d'event */}
          {eventType && (
            <div
              style={{
                fontSize: `${22 * scale}px`,
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: isStory ? '60px' : '30px',
              }}
            >
              {eventType}
            </div>
          )}

          {/* Separador daurat */}
          <div
            style={{
              width: `${120 * scale}px`,
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #FFB800, transparent)',
              marginBottom: isStory ? '60px' : '30px',
            }}
          />

          {/* Box de codi de descompte */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255, 184, 0, 0.1)',
              border: '2px solid rgba(255, 184, 0, 0.4)',
              borderRadius: '24px',
              padding: isStory ? '40px 60px' : '25px 40px',
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontSize: `${20 * scale}px`,
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'uppercase',
                letterSpacing: '4px',
                marginBottom: '12px',
              }}
            >
              El teu regal exclusiu
            </span>
            <span
              style={{
                fontSize: `${codeSize}px`,
                fontWeight: 800,
                color: '#FFB800',
                letterSpacing: '6px',
                marginBottom: '8px',
              }}
            >
              {code}
            </span>
            <span
              style={{
                fontSize: `${36 * scale}px`,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {discount}% DESCOMPTE
            </span>
            <span
              style={{
                fontSize: `${16 * scale}px`,
                color: 'rgba(255, 255, 255, 0.4)',
                marginTop: '12px',
              }}
            >
              Vàlid durant 6 mesos · Pròxim event
            </span>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: isStory ? '60px' : '30px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: `${18 * scale}px`,
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              www.orbitaevents.com
            </span>
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    );
  } catch (error: unknown) {
    console.error('Error generating rating canvas:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error generating image: ${message}`, {
      status: 500,
    });
  }
}
