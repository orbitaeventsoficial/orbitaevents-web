"use client";
// app/error.tsx (global fallback sin next-intl context)
// Mantenerlo sin hooks de traducción para evitar errores cuando falla el provider

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <head>
        <title>Algo fue mal | órbita Events</title>
        <meta name="robots" content="noindex" />
      </head>
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#fff',
          fontFamily: '-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>😕</div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Algo salió mal</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
            {error?.message || 'Error inesperado. Intenta recargar.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid #d7b86e',
                background: '#d7b86e',
                color: '#000',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
            <a
              href="/"
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                textDecoration: 'none',
              }}
            >
              Ir al inicio
            </a>
          </div>
          <p style={{ marginTop: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
            Código: {error?.digest || 'N/D'}
          </p>
        </div>
      </body>
    </html>
  );
}
