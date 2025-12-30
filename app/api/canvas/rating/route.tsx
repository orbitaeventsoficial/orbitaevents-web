// app/api/canvas/rating/route.tsx
// Genera un canvas d'agraïment amb descompte
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const name = searchParams.get('name') || 'Client';
  const rating = parseInt(searchParams.get('rating') || '10');
  const code = searchParams.get('code') || 'ORBITA10';
  const discount = parseInt(searchParams.get('discount') || '10');
  const preset = searchParams.get('preset') || 'default';

  // Dimensions segons preset
  const dimensions = preset === 'instagram'
    ? { width: 1080, height: 1080 }
    : preset === 'story'
    ? { width: 1080, height: 1920 }
    : { width: 800, height: 600 }; // email/default

  // Generar estrelles
  const fullStars = Math.floor(rating / 2);
  const halfStar = rating % 2 === 1;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  const stars = '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars);

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
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          fontFamily: 'system-ui, sans-serif',
          padding: '60px',
        }}
      >
        {/* Decoració daurat superior */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #B8860B, #DAA520, #FFD700, #DAA520, #B8860B)',
          }}
        />

        {/* Logo / Nom */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '30px',
          }}
        >
          <span
            style={{
              fontSize: '28px',
              color: '#DAA520',
              letterSpacing: '4px',
              marginBottom: '8px',
            }}
          >
            ÒRBITA EVENTS
          </span>
          <span
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '2px',
            }}
          >
            GRÀCIES PER LA TEVA CONFIANÇA
          </span>
        </div>

        {/* Nom del client */}
        <div
          style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          {name.split(' ')[0]}
        </div>

        {/* Estrelles */}
        <div
          style={{
            fontSize: '48px',
            color: '#FFD700',
            marginBottom: '30px',
            letterSpacing: '8px',
          }}
        >
          {stars}
        </div>

        {/* Box del descompte */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(218, 165, 32, 0.1)',
            border: '3px solid rgba(218, 165, 32, 0.5)',
            borderRadius: '24px',
            padding: '40px 60px',
            marginBottom: '30px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '3px',
              marginBottom: '12px',
            }}
          >
            EL TEU CODI EXCLUSIU
          </span>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#DAA520',
              letterSpacing: '6px',
              marginBottom: '16px',
            }}
          >
            {code}
          </span>
          <span
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#ffffff',
            }}
          >
            {discount}% OFF
          </span>
          <span
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              marginTop: '16px',
            }}
          >
            Vàlid 6 mesos · Pròxim event
          </span>
        </div>

        {/* Missatge */}
        <span
          style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            maxWidth: '500px',
          }}
        >
          Comparteix aquest codi amb amics i familiars
        </span>

        {/* Decoració daurat inferior */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #B8860B, #DAA520, #FFD700, #DAA520, #B8860B)',
          }}
        />
      </div>
    ),
    {
      ...dimensions,
    }
  );
}
