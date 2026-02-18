'use client';

/**
 * ADMIN PANEL - GESTIÓ DE DUPLICATS
 * Detecta i fusiona clients duplicats amb scoring intel·ligent
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/csrf';

interface MatchReason {
  field: string;
  type: string;
  score: number;
}

interface DuplicateCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  totalEvents: number;
  totalSpent: number;
  createdAt: string;
}

interface DuplicateMatch {
  customer: DuplicateCustomer;
  matchScore: number;
  matchReasons: MatchReason[];
}

interface DuplicateGroup {
  primaryCustomer: DuplicateCustomer;
  duplicates: DuplicateMatch[];
  suggestedAction: 'auto_merge' | 'review' | 'ignore';
}

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Telèfon',
  name: 'Nom',
  instagram: 'Instagram',
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  auto_merge: { label: 'Fusió recomanada', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  review: { label: 'Cal revisar', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  ignore: { label: 'Prioritat baixa', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

export default function DuplicatsPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [merging, setMerging] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalGroups: number; totalDuplicates: number; autoMergeRecommended: number } | null>(null);
  const [filter, setFilter] = useState<'all' | 'auto_merge' | 'review'>('all');

  const fetchDuplicates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsRes, statsRes] = await Promise.all([
        fetch('/api/admin/duplicates', { credentials: 'include' }),
        fetch('/api/admin/duplicates?stats=true', { credentials: 'include' }),
      ]);

      if (!groupsRes.ok) throw new Error('Error carregant duplicats');

      const groupsData = await groupsRes.json();
      const statsData = await statsRes.json();

      setGroups(groupsData?.data?.groups || []);
      setStats(statsData?.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDuplicates();
  }, [fetchDuplicates]);

  const handleMerge = async (primaryId: string, duplicateIds: string[]) => {
    if (!window.confirm(
      `Estàs segur de fusionar ${duplicateIds.length + 1} clients?\n\n` +
      `El client principal mantindrà les seves dades i rebrà tots els leads, reserves i activitat dels duplicats.\n` +
      `Els duplicats es desactivaran.`
    )) return;

    setMerging(primaryId);
    try {
      const res = await fetchWithCsrf('/api/admin/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryId, duplicateIds }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Error fusionant');
      }

      // Refresh
      await fetchDuplicates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setMerging(null);
    }
  };

  const filteredGroups = filter === 'all'
    ? groups
    : groups.filter((g) => g.suggestedAction === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            Detecció de Duplicats
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Troba i fusiona clients duplicats automàticament
          </p>
        </div>

        {stats && (
          <div className="flex gap-3 flex-wrap">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-slate-100">{stats.totalGroups}</p>
              <p className="text-xs text-slate-400">Grups</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-slate-100">{stats.totalDuplicates}</p>
              <p className="text-xs text-amber-400">Duplicats</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-slate-100">{stats.autoMergeRecommended}</p>
              <p className="text-xs text-emerald-400">Fusió auto</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'auto_merge', 'review'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              filter === f
                ? 'bg-slate-100 text-slate-900'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {f === 'all' ? 'Tots' : f === 'auto_merge' ? 'Fusió recomanada' : 'Cal revisar'}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
          <p className="text-rose-300">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty */}
      {!loading && filteredGroups.length === 0 && (
        <div className="text-center py-20 rounded-2xl border border-slate-700/50 bg-slate-800/60">
          <p className="text-4xl mb-3">{"\\u2728"}</p>
          <p className="text-slate-200 text-lg font-medium">Cap duplicat detectat</p>
          <p className="text-slate-400 text-sm mt-1">La base de dades està neta</p>
        </div>
      )}

      {/* Duplicate Groups */}
      {!loading && filteredGroups.map((group) => {
        const actionStyle = ACTION_LABELS[group.suggestedAction];
        const allDupIds = group.duplicates.map((d) => d.customer.id);
        const isMerging = merging === group.primaryCustomer.id;

        return (
          <div
            key={group.primaryCustomer.id}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/60 overflow-hidden"
          >
            {/* Group header */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-700/30 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${actionStyle.color}`}>
                  {actionStyle.label}
                </span>
                <span className="text-sm text-slate-400">
                  {group.duplicates.length + 1} clients similars
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleMerge(group.primaryCustomer.id, allDupIds)}
                disabled={isMerging}
                className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-1.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50 transition-all"
              >
                {isMerging ? 'Fusionant...' : 'Fusionar tots'}
              </button>
            </div>

            {/* Primary customer */}
            <div className="px-5 py-3 border-b border-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold text-sm">
                  {group.primaryCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/admin/contactes/${group.primaryCustomer.id}`}
                    className="text-sm font-semibold text-slate-100 hover:text-cyan-300 transition-colors"
                  >
                    {group.primaryCustomer.name}
                  </Link>
                  <p className="text-xs text-slate-400 truncate">
                    {group.primaryCustomer.email}
                    {group.primaryCustomer.phone ? ` · ${group.primaryCustomer.phone}` : ''}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                  PRINCIPAL
                </span>
              </div>
            </div>

            {/* Duplicates */}
            {group.duplicates.map((dup) => (
              <div
                key={dup.customer.id}
                className="px-5 py-3 border-b border-slate-700/20 last:border-b-0 bg-slate-800/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 font-bold text-sm">
                    {dup.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/contactes/${dup.customer.id}`}
                      className="text-sm font-medium text-slate-200 hover:text-cyan-300 transition-colors"
                    >
                      {dup.customer.name}
                    </Link>
                    <p className="text-xs text-slate-400 truncate">
                      {dup.customer.email}
                      {dup.customer.phone ? ` · ${dup.customer.phone}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      dup.matchScore >= 80 ? 'bg-rose-500/20 text-rose-300' :
                      dup.matchScore >= 50 ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {dup.matchScore}%
                    </span>
                    <div className="flex gap-1">
                      {dup.matchReasons.map((r, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700/50 text-slate-400"
                        >
                          {FIELD_LABELS[r.field] || r.field}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
