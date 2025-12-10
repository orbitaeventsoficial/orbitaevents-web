// app/[locale]/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '42rem',
        textAlign: 'center',
        color: 'white'
      }}>
        {/* 404 */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '9rem',
            fontWeight: 900,
            color: 'rgba(215, 184, 110, 0.2)',
            margin: 0,
            marginBottom: '1rem'
          }}>
            404
          </h1>
          <div style={{
            width: '6rem',
            height: '0.25rem',
            backgroundColor: 'var(--oe-gold)',
            margin: '0 auto',
            borderRadius: '9999px'
          }} />
        </div>

        {/* Título */}
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          marginBottom: '1rem'
        }}>
          Esta Página No Existe
        </h2>

        {/* Descripción */}
        <p style={{
          fontSize: '1.25rem',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '2rem',
          lineHeight: '1.75'
        }}>
          Parece que esta página se fue de fiesta y no volvió.
          <br />
          Pero tranquilo, podemos ayudarte a encontrar lo que buscas.
        </p>

        {/* Botones */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '3rem',
          alignItems: 'center'
        }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2rem',
              backgroundColor: 'var(--oe-gold)',
              color: '#000',
              fontWeight: 700,
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontSize: '1.125rem'
            }}
          >
            Volver al Inicio
          </Link>

          <Link
            href="/servicios"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontWeight: 700,
              borderRadius: '0.75rem',
              textDecoration: 'none',
              border: '1px solid rgba(215, 184, 110, 0.3)',
              fontSize: '1.125rem'
            }}
          >
            Ver Servicios
          </Link>
        </div>

        {/* Links útiles */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '2rem'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '1rem'
          }}>
            ¿Buscabas algo específico?
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1rem',
            fontSize: '0.875rem'
          }}>
            <Link href="/servicios/bodas" style={{ color: 'var(--oe-gold)', textDecoration: 'none' }}>
              DJ Bodas
            </Link>
            <Link href="/servicios/discomovil" style={{ color: 'var(--oe-gold)', textDecoration: 'none' }}>
              Discomóvil
            </Link>
            <Link href="/servicios/alquiler" style={{ color: 'var(--oe-gold)', textDecoration: 'none' }}>
              Alquiler
            </Link>
            <Link href="/servicios/empresas" style={{ color: 'var(--oe-gold)', textDecoration: 'none' }}>
              Empresas
            </Link>
            <Link href="/faq" style={{ color: 'var(--oe-gold)', textDecoration: 'none' }}>
              FAQ
            </Link>
            <Link href="/contacto" style={{ color: 'var(--oe-gold)', textDecoration: 'none' }}>
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
