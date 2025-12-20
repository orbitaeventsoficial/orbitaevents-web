'use client';

/**
 * 📊 DASHBOARD - Vista principal Admin (versió simplificada)
 */

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-neutral-500">Benvingut, Carles 👋</p>
      </div>

      {/* Mètriques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141414] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <span className="text-lg">💰</span>
            <span>Facturat aquest mes</span>
          </div>
          <div className="mt-2 text-3xl font-bold text-white">0€</div>
        </div>

        <div className="bg-[#141414] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <span className="text-lg">📅</span>
            <span>Events confirmats</span>
          </div>
          <div className="mt-2 text-3xl font-bold text-white">0</div>
        </div>

        <div className="bg-[#141414] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <span className="text-lg">👥</span>
            <span>Leads nous</span>
          </div>
          <div className="mt-2 text-3xl font-bold text-white">0</div>
        </div>

        <div className="bg-[#141414] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <span className="text-lg">⭐</span>
            <span>Valoració mitjana</span>
          </div>
          <div className="mt-2 text-3xl font-bold text-white">5.0</div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#141414] rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pròxims events</h3>
          <p className="text-neutral-500">No hi ha events programats</p>
        </div>

        <div className="bg-[#141414] rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Leads recents</h3>
          <p className="text-neutral-500">No hi ha leads encara</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-4">
        <a
          href="/admin/leads"
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
        >
          + Nou lead
        </a>
        <a
          href="/admin/bookings"
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-medium transition-colors"
        >
          📅 Reserves
        </a>
        <a
          href="/admin/testimonios"
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-medium transition-colors"
        >
          ⭐ Testimonis
        </a>
      </div>
    </div>
  );
}
