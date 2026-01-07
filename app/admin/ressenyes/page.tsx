'use client';
import { log } from '@/lib/logger';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SITE_CONFIG } from '@/app/config/site-config';

interface Review {
  id: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  text: string;
  eventType?: string;
  eventDate?: string;
  isApproved: boolean;
  showName: boolean;
  source: string;
  createdAt: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: '💍 Boda',
  BIRTHDAY: '🎂 Aniversari',
  CORPORATE: '🎯 Corporatiu',
  COMMUNION: '⛪ Comunió',
  BAPTISM: '👶 Bateig',
  GRADUATION: '🎓 Graduació',
  ANNIVERSARY: '🎉 Aniversari',
  PRIVATE_PARTY: '🎵 Festa privada',
  OTHER: '📋 Altre',
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleLocation, setGoogleLocation] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({
    customerName: '',
    customerEmail: '',
    rating: 5,
    text: '',
    eventType: 'OTHER',
    source: 'whatsapp',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchGoogleStatus();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/customer-testimonials?stats=true');
      const data = await res.json();
      
      // Transform API response to match our Review interface
      const testimonials = (data.data || []).map((t: any) => ({
        id: t.id,
        customerName: t.name || t.customer?.name || 'Anònim',
        customerEmail: t.customer?.email,
        rating: t.rating,
        text: t.comment || t.text,
        eventType: t.eventType,
        eventDate: t.eventDate,
        isApproved: t.isApproved ?? true,
        showName: t.showName ?? true,
        source: t.source || 'customer',
        createdAt: t.createdAt,
      }));
      
      setReviews(testimonials);
    } catch (error) {
      log.error('Error carregant ressenyes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleStatus = async () => {
    try {
      const res = await fetch('/api/admin/settings?category=integrations');
      const data = await res.json();
      const settings = data?.settings || {};
      setGoogleConnected(!!settings['integrations.google.refreshToken']);
      setGoogleLocation(settings['integrations.google.locationId'] || null);
    } catch (error) {
      log.error('Error carregant Google status:', error);
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await fetch(`/api/admin/customer-testimonials`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved: approved }),
      });
      fetchReviews();
    } catch (error) {
      log.error('Error actualitzant:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Segur que vols eliminar aquesta ressenya?')) return;
    
    try {
      await fetch(`/api/admin/customer-testimonials?id=${id}`, {
        method: 'DELETE',
      });
      fetchReviews();
    } catch (error) {
      log.error('Error eliminant:', error);
    }
  };

  const handleAddReview = async () => {
    if (!newReview.customerName || !newReview.text) {
      alert('Nom i text són obligatoris');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/admin/customer-testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview),
      });
      setShowAddModal(false);
      setNewReview({
        customerName: '',
        customerEmail: '',
        rating: 5,
        text: '',
        eventType: 'OTHER',
        source: 'whatsapp',
      });
      fetchReviews();
    } catch (error) {
      log.error('Error afegint ressenya:', error);
      alert('Error afegint ressenya');
    } finally {
      setSaving(false);
    }
  };

  const approvedCount = reviews.filter(r => r.isApproved).length;
  const pendingCount = reviews.filter(r => !r.isApproved).length;
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin"
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block"
          >
            ← Tornar al panell
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            ⭐ Gestió de Ressenyes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ressenyes verificades que es mostren a la web
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link
            href="/admin/testimonios"
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Testimonis
          </Link>
          <a
            href={SITE_CONFIG.reviews.googleBusinessUrl || '#'}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Veure a Google
          </a>
          <a
            href="/api/google/oauth/start?next=/admin/ressenyes?google=connected"
            className="inline-flex items-center px-4 py-2 bg-white rounded-lg text-sm font-medium text-black hover:bg-slate-100"
          >
            {googleConnected ? 'Google connectat' : 'Connectar Google'}
          </a>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-amber-500 rounded-lg text-sm font-medium text-white hover:bg-amber-600"
          >
            ➕ Afegir Ressenya
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total</p>
          <p className="mt-2 text-3xl font-bold text-black">{reviews.length}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase">Aprovades</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{approvedCount}</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-yellow-600 uppercase">Pendents</p>
          <p className="mt-2 text-3xl font-bold text-yellow-700">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-amber-600 uppercase">Rating Mitjà</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">⭐ {avgRating}</p>
        </div>
      </div>

      {/* Google Reviews Link */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-4xl">📋</div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">URL per demanar ressenyes a clients</h3>
            <p className="text-sm text-blue-700 mt-1">
              Envia aquest link als clients després de l'event perquè deixin la seva opinió a Google:
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white rounded border border-blue-200 text-sm text-blue-800 break-all">
                {SITE_CONFIG.reviews.googleReviewUrl}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(SITE_CONFIG.reviews.googleReviewUrl || '');
                  alert('Link copiat!');
                }}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                📋 Copiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-black">Ressenyes</h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500">Carregant...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <p className="text-slate-500 mb-2">Encara no hi ha ressenyes</p>
            <p className="text-sm text-slate-400">
              Afegeix ressenyes que hagis rebut per WhatsApp, email o en persona
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {review.customerName.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-black">{review.customerName}</span>
                      {review.eventType && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                          {EVENT_TYPE_LABELS[review.eventType] || review.eventType}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 bg-blue-100 rounded-full text-blue-700">
                        {review.source}
                      </span>
                      {!review.isApproved && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 rounded-full text-yellow-700">
                          ⏳ Pendent
                        </span>
                      )}
                      {review.isApproved && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 rounded-full text-green-700">
                          ✅ Aprovada
                        </span>
                      )}
                    </div>
                    
                    {/* Stars */}
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= review.rating ? 'text-amber-400' : 'text-slate-200'}>
                          ★
                        </span>
                      ))}
                      <span className="text-xs text-slate-500 ml-2">
                        {new Date(review.createdAt).toLocaleDateString('ca-ES')}
                      </span>
                    </div>
                    
                    {/* Text */}
                    <p className="mt-2 text-slate-700">{review.text}</p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {!review.isApproved ? (
                      <button
                        onClick={() => handleApprove(review.id, true)}
                        className="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        ✅ Aprovar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(review.id, false)}
                        className="px-3 py-1.5 bg-yellow-500 text-black rounded text-sm hover:bg-yellow-600"
                      >
                        ⏸️ Despublicar
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-200/70 flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-black">Afegir Ressenya</h2>
              <p className="text-sm text-slate-500 mt-1">
                Afegeix una ressenya que hagis rebut per WhatsApp, email o en persona
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom del client *
                </label>
                <input
                  type="text"
                  value={newReview.customerName}
                  onChange={(e) => setNewReview({ ...newReview, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Maria García"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={newReview.customerEmail}
                  onChange={(e) => setNewReview({ ...newReview, customerEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="maria@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Valoració *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className={`text-3xl transition-transform hover:scale-110 ${
                        star <= newReview.rating ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipus d'event
                </label>
                <select
                  value={newReview.eventType}
                  onChange={(e) => setNewReview({ ...newReview, eventType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Font de la ressenya
                </label>
                <select
                  value={newReview.source}
                  onChange={(e) => setNewReview({ ...newReview, source: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="email">✉️ Email</option>
                  <option value="direct">🎤 En persona</option>
                  <option value="google">🔍 Google</option>
                  <option value="instagram">📸 Instagram</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Text de la ressenya *
                </label>
                <textarea
                  value={newReview.text}
                  onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="El servei va ser excel·lent, la festa va ser increïble..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel·lar
              </button>
              <button
                onClick={handleAddReview}
                disabled={saving}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {saving ? 'Guardant...' : 'Guardar Ressenya'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
