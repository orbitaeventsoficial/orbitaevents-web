'use client';
import { log } from '@/lib/logger';

/**
 * Panel Admin - Gestió de Duplicats
 * Detecta i fusiona clients duplicats intel·ligentment
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  AlertTriangle,
  Check,
  Mail,
  Phone,
  Instagram,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Merge,
  Eye,
  Sparkles,
} from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  instagram: string | null;
  totalEvents: number;
  totalSpent: number;
  createdAt: string;
}

interface MatchReason {
  field: string;
  type: 'exact' | 'similar' | 'partial';
  value1: string;
  value2: string;
  score: number;
}

interface DuplicateMatch {
  customer: Customer;
  matchScore: number;
  matchReasons: MatchReason[];
}

interface DuplicateGroup {
  primaryCustomer: Customer;
  duplicates: DuplicateMatch[];
  suggestedAction: 'auto_merge' | 'review' | 'ignore';
}

export default function AdminDuplicatesPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [totalDuplicates, setTotalDuplicates] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [mergeSelection, setMergeSelection] = useState<{
    groupIndex: number;
    primaryId: string;
    duplicateIds: string[];
  } | null>(null);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    loadDuplicates();
  }, []);

  const loadDuplicates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/duplicates');
      const data = await res.json();

      if (data.success) {
        setGroups(data.data.groups);
        setTotalDuplicates(data.data.totalDuplicates);
      }
    } catch (error) {
      log.error('Error loading duplicates:', error);
    }
    setIsLoading(false);
  };

  const handleMerge = async () => {
    if (!mergeSelection) return;

    setMerging(true);
    try {
      const res = await fetch('/api/admin/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryId: mergeSelection.primaryId,
          duplicateIds: mergeSelection.duplicateIds,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`${data.message}`);
        setMergeSelection(null);
        setExpandedGroup(null);
        loadDuplicates();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      log.error('Error merging:', error);
      alert('Error de connexió');
    }
    setMerging(false);
  };

  const startMerge = (groupIndex: number, group: DuplicateGroup) => {
    setMergeSelection({
      groupIndex,
      primaryId: group.primaryCustomer.id,
      duplicateIds: group.duplicates.map(d => d.customer.id),
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (score >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'auto_merge':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Fusionar recomanat
          </span>
        );
      case 'review':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Revisar
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full">
            Baixa probabilitat
          </span>
        );
    }
  };

  const getMatchIcon = (field: string) => {
    switch (field) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'name':
        return <Users className="w-4 h-4" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Merge className="w-8 h-8 text-purple-400" />
              Unificació de Clients
            </h1>
            <p className="text-gray-400 mt-1">
              Detecta i fusiona clients duplicats intel·ligentment
            </p>
          </div>
          <button
            onClick={loadDuplicates}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-slate-800 transition-colors"
          >
            <RefreshCw
              className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
            />
            Actualitzar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-slate-800">{groups.length}</div>
            <div className="text-sm text-gray-400">Grups detectats</div>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-red-400">
              {totalDuplicates}
            </div>
            <div className="text-sm text-gray-400">Possibles duplicats</div>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-amber-400">
              {groups.filter(g => g.suggestedAction === 'auto_merge').length}
            </div>
            <div className="text-sm text-gray-400">Fusió recomanada</div>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-purple-400">
              {groups.filter(g => g.suggestedAction === 'review').length}
            </div>
            <div className="text-sm text-gray-400">Per revisar</div>
          </div>
        </div>

        {/* Duplicate Groups */}
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="text-center py-16 bg-stone-50 border border-stone-200 rounded-2xl">
              <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Cap duplicat detectat!
              </h3>
              <p className="text-gray-400">
                La base de dades està neta de duplicats
              </p>
            </div>
          ) : (
            groups.map((group, groupIndex) => (
              <motion.div
                key={group.primaryCustomer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.05 }}
                className="bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden"
              >
                {/* Group Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-stone-100 transition-colors"
                  onClick={() =>
                    setExpandedGroup(
                      expandedGroup === groupIndex ? null : groupIndex
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl ${getScoreColor(group.duplicates[0]?.matchScore || 0)}`}
                      >
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {group.primaryCustomer.name ||
                            group.primaryCustomer.email}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {group.duplicates.length} possible
                          {group.duplicates.length > 1 ? 's' : ''} duplicat
                          {group.duplicates.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getActionBadge(group.suggestedAction)}
                      {expandedGroup === groupIndex ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedGroup === groupIndex && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 border-t border-stone-200">
                        {/* Primary Customer */}
                        <div className="mb-4">
                          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                            Client principal
                          </div>
                          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                            <CustomerCard
                              customer={group.primaryCustomer}
                              isPrimary
                            />
                          </div>
                        </div>

                        {/* Duplicates */}
                        <div className="mb-4">
                          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                            Possibles duplicats
                          </div>
                          <div className="space-y-3">
                            {group.duplicates.map(dup => (
                              <div
                                key={dup.customer.id}
                                className="bg-stone-100 border border-stone-200 rounded-xl p-4"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <CustomerCard customer={dup.customer} />
                                  <div
                                    className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(dup.matchScore)}`}
                                  >
                                    {dup.matchScore}%
                                  </div>
                                </div>

                                {/* Match Reasons */}
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-stone-200">
                                  {dup.matchReasons.map((reason) => (
                                    <div
                                      key={`${reason.field}-${reason.type}`}
                                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                        reason.type === 'exact'
                                          ? 'bg-green-500/10 text-green-400'
                                          : reason.type === 'similar'
                                            ? 'bg-amber-500/10 text-amber-400'
                                            : 'bg-blue-500/10 text-blue-400'
                                      }`}
                                    >
                                      {getMatchIcon(reason.field)}
                                      <span className="capitalize">
                                        {reason.field}
                                      </span>
                                      <span className="opacity-60">
                                        (
                                        {reason.type === 'exact'
                                          ? 'exacte'
                                          : reason.type === 'similar'
                                            ? 'similar'
                                            : 'parcial'}
                                        )
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-stone-200">
                          <button
                            onClick={() => startMerge(groupIndex, group)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:opacity-90 text-white font-semibold rounded-xl transition-all"
                          >
                            <Merge className="w-5 h-5" />
                            Fusionar tots
                          </button>
                          <button
                            onClick={() => setExpandedGroup(null)}
                            className="px-6 py-3 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-slate-800 font-medium rounded-xl transition-colors"
                          >
                            Ignorar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>

        {/* Merge Confirmation Modal */}
        <AnimatePresence>
          {mergeSelection && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-stone-200/80 flex items-center justify-center p-4 z-50"
              onClick={() => setMergeSelection(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-stone-50 border border-stone-200 rounded-2xl p-6 max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-purple-500/20">
                    <Merge className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Confirmar fusió
                    </h3>
                    <p className="text-sm text-gray-400">
                      Es fusionaran {mergeSelection.duplicateIds.length + 1}{' '}
                      clients
                    </p>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                  <p className="text-sm text-amber-400">
                    <strong>Atenció:</strong> Aquesta acció no es pot desfer.
                    Els events i testimonis es reassignaran al client principal.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setMergeSelection(null)}
                    className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-slate-800 font-medium rounded-xl transition-colors"
                  >
                    Cancel·lar
                  </button>
                  <button
                    onClick={handleMerge}
                    disabled={merging}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {merging ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Fusionant...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Confirmar
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Component auxiliar per mostrar un client
function CustomerCard({
  customer,
  isPrimary = false,
}: {
  customer: Customer;
  isPrimary?: boolean;
}) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-slate-800">
          {customer.name || 'Sense nom'}
        </span>
        {isPrimary && (
          <span className="px-2 py-0.5 text-xs bg-purple-500/30 text-purple-300 rounded">
            Principal
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1 text-gray-400">
          <Mail className="w-3 h-3" />
          <span className="truncate">{customer.email}</span>
        </div>
        {customer.phone && (
          <div className="flex items-center gap-1 text-gray-400">
            <Phone className="w-3 h-3" />
            <span>{customer.phone}</span>
          </div>
        )}
        {customer.instagram && (
          <div className="flex items-center gap-1 text-gray-400">
            <Instagram className="w-3 h-3" />
            <span>@{customer.instagram}</span>
          </div>
        )}
      </div>
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span>{customer.totalEvents} events</span>
        <span>{customer.totalSpent}€ gastat</span>
        <span>
          Des de {new Date(customer.createdAt).toLocaleDateString('ca-ES')}
        </span>
      </div>
    </div>
  );
}
