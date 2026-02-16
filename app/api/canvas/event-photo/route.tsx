// app/api/canvas/event-photo/route.tsx
// Canvas dinàmic amb foto de l'esdeveniment del client + codi de descompte
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Paràmetres
  const name = searchParams.get('name') || 'Client';
  const code = searchParams.get('code') || 'ORBITA15';
  const discount = searchParams.get('discount') || '15';
  const photoUrl = searchParams.get('photo') || '';
  const eventType = searchParams.get('event') || 'event';
  const preset = searchParams.get('preset') || 'email'; // email, instagram, story

  // Dimensions segons preset
  const dimensions: Record<string, { width: number; height: number }> = {
    email: { width: 600, height: 400 },
    instagram: { width: 1080, height: 1080 },
    story: { width: 1080, height: 1920 },
  };

  const { width, height } = dimensions[preset] || dimensions.email;
  const isStory = preset === 'story';
  const isSquare = preset === 'instagram';

  // Event type labels
  const eventLabels: Record<string, string> = {
    WEDDING: 'la teva boda',
    BIRTHDAY: 'el teu aniversari',
    CORPORATE: 'el teu esdeveniment corporatiu',
    COMMUNION: 'la teva comunió',
    BAPTISM: 'el teu bateig',
    event: 'el teu esdeveniment',
  };

  const eventLabel = eventLabels[eventType] || eventLabels.event;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Background photo amb overlay */}
        {photoUrl ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Gradient overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.95) 100%)',
              }}
            />
          </div>
        ) : (
          // Fallback gradient if no photo
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1f00 50%, #1a1a1a 100%)',
            }}
          />
        )}

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isStory ? 'flex-end' : 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            padding: isStory ? '60px 40px 120px' : '40px',
            textAlign: 'center',
          }}
        >
          {/* Top badge - Thank you */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: isStory ? '40px' : '20px',
            }}
          >
            <span style={{ fontSize: isStory ? '40px' : '24px' }}>✨</span>
            <span
              style={{
                color: '#DAA520',
                fontSize: isStory ? '18px' : '14px',
                fontWeight: 600,
                letterSpacing: '3px',
                textTransform: 'uppercase',
              }}
            >
              Gràcies per confiar en nosaltres
            </span>
            <span style={{ fontSize: isStory ? '40px' : '24px' }}>✨</span>
          </div>

          {/* Main text */}
          <h1
            style={{
              color: '#ffffff',
              fontSize: isStory ? '48px' : isSquare ? '42px' : '32px',
              fontWeight: 300,
              margin: '0 0 16px 0',
              lineHeight: 1.2,
            }}
          >
            {name}, esperem que
          </h1>
          <h2
            style={{
              color: '#DAA520',
              fontSize: isStory ? '56px' : isSquare ? '48px' : '36px',
              fontWeight: 700,
              margin: '0 0 40px 0',
              textShadow: '0 2px 20px rgba(218,165,32,0.5)',
            }}
          >
            {eventLabel} fos increïble!
          </h2>

          {/* Discount box */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(30,25,10,0.85)',
              border: '2px solid rgba(218,165,32,0.6)',
              borderRadius: '24px',
              padding: isStory ? '40px 60px' : '30px 50px',
            }}
          >
            <span
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: isStory ? '18px' : '14px',
                marginBottom: '8px',
              }}
            >
              El teu descompte exclusiu
            </span>
            <span
              style={{
                color: '#DAA520',
                fontSize: isStory ? '72px' : isSquare ? '64px' : '48px',
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {discount}% OFF
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '16px',
                background: '#DAA520',
                borderRadius: '12px',
                padding: '12px 24px',
              }}
            >
              <span
                style={{
                  color: '#000',
                  fontSize: isStory ? '28px' : '20px',
                  fontWeight: 700,
                  letterSpacing: '4px',
                }}
              >
                {code}
              </span>
            </div>
            <span
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: isStory ? '14px' : '12px',
                marginTop: '12px',
              }}
            >
              Vàlid per al teu pròxim esdeveniment
            </span>
          </div>

          {/* Logo Orbita */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: isStory ? '60px' : '30px',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://orbitaevents.com/img/orbitalockupwhitetransparent.webp"
              alt="Òrbita Events"
              style={{
                height: isStory ? '60px' : isSquare ? '50px' : '40px',
                width: 'auto',
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
    }
  );
}
