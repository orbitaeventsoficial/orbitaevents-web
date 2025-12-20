/**
 * 🎨 ADMIN LAYOUT - Amb estructura HTML completa
 */

import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca">
      <body style={{ margin: 0, minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <div>
          {/* Header */}
          <header style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                Ò
              </div>
              <span style={{ fontWeight: '600' }}>
                <span style={{ color: '#f97316' }}>Òrbita</span> Admin
              </span>
            </div>
            <nav style={{ display: 'flex', gap: '16px' }}>
              <Link href="/admin" style={{ color: '#f97316', textDecoration: 'none' }}>Dashboard</Link>
              <Link href="/admin/leads" style={{ color: '#999', textDecoration: 'none' }}>Leads</Link>
              <Link href="/admin/bookings" style={{ color: '#999', textDecoration: 'none' }}>Reserves</Link>
              <Link href="/admin/testimonios" style={{ color: '#999', textDecoration: 'none' }}>Testimonis</Link>
            </nav>
          </header>

          {/* Main Content */}
          <main style={{ padding: '24px' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
