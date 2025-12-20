/**
 * 📊 DASHBOARD - Server Component Pur
 */

import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#888', marginTop: '4px' }}>Benvingut, Carles</p>
      </div>

      {/* Mètriques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#141414', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '24px' }}>
          <div style={{ color: '#888', fontSize: '14px' }}>💰 Facturat aquest mes</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginTop: '8px' }}>0€</div>
        </div>

        <div style={{ background: '#141414', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '24px' }}>
          <div style={{ color: '#888', fontSize: '14px' }}>📅 Events confirmats</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginTop: '8px' }}>0</div>
        </div>

        <div style={{ background: '#141414', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '24px' }}>
          <div style={{ color: '#888', fontSize: '14px' }}>👥 Leads nous</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginTop: '8px' }}>0</div>
        </div>

        <div style={{ background: '#141414', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '24px' }}>
          <div style={{ color: '#888', fontSize: '14px' }}>⭐ Valoració</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginTop: '8px' }}>5.0</div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#141414', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '24px' }}>
          <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>Pròxims events</h3>
          <p style={{ color: '#666', marginTop: '12px' }}>No hi ha events programats</p>
        </div>

        <div style={{ background: '#141414', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '24px' }}>
          <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>Leads recents</h3>
          <p style={{ color: '#666', marginTop: '12px' }}>No hi ha leads encara</p>
        </div>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link
          href="/admin/leads"
          style={{
            padding: '12px 20px',
            background: '#f97316',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          + Nou lead
        </Link>
        <Link
          href="/admin/bookings"
          style={{
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '500',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          📅 Reserves
        </Link>
        <Link
          href="/admin/testimonios"
          style={{
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '500',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          ⭐ Testimonis
        </Link>
      </div>
    </div>
  );
}
