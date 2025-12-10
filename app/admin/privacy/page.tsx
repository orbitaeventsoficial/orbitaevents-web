'use client';

import { useState, useEffect } from 'react';
import {
  Shield, Clock, CheckCircle, AlertTriangle, XCircle,
  Eye, Download, Trash2, Edit3, Ban, UserCog, RefreshCw,
  Calendar, Mail, User, FileText, ChevronDown, ChevronUp,
  Search, Filter, AlertCircle
} from 'lucide-react';

interface DataRequest {
  id: string;
  requesterEmail: string;
  requesterName: string;
  requesterPhone?: string;
  requestType: string;
  description?: string;
  status: string;
  priority: string;
  verifiedAt?: string;
  processedAt?: string;
  legalDeadline: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

interface PrivacyStats {
  consents: {
    total: number;
    active: number;
  };
  requests: {
    pending: number;
    completed: number;
    urgent: number;
  };
}

const REQUEST_TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  ACCESS: { icon: Eye, label: "Dret d'Accés", color: 'blue' },
  RECTIFICATION: { icon: Edit3, label: 'Rectificació', color: 'amber' },
  ERASURE: { icon: Trash2, label: 'Supressió', color: 'red' },
  RESTRICTION: { icon: UserCog, label: 'Limitació', color: 'orange' },
  PORTABILITY: { icon: Download, label: 'Portabilitat', color: 'green' },
  OBJECTION: { icon: Ban, label: 'Oposició', color: 'purple' },
  AUTOMATED: { icon: UserCog, label: 'Decisions Automatitzades', color: 'gray' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pendent', color: 'yellow', icon: Clock },
  IDENTITY_REQUIRED: { label: 'Verificació pendent', color: 'orange', icon: AlertTriangle },
  VERIFIED: { label: 'Verificat', color: 'blue', icon: CheckCircle },
  IN_PROGRESS: { label: 'En procés', color: 'purple', icon: RefreshCw },
  COMPLETED: { label: 'Completat', color: 'green', icon: CheckCircle },
  REJECTED: { label: 'Rebutjat', color: 'red', icon: XCircle },
  CANCELLED: { label: 'Cancel·lat', color: 'gray', icon: XCircle },
};

export default function AdminPrivacyPage() {
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [stats, setStats] = useState<PrivacyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [requestsRes, statsRes] = await Promise.all([
        fetch('/api/admin/privacy/requests'),
        fetch('/api/admin/privacy/stats'),
      ]);

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRequests(requestsData.data || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }
    } catch (err) {
      setError('Error carregant les dades');
    }
    setIsLoading(false);
  };

  const handleProcess = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/admin/privacy/requests/${requestId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });

      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Error processant la sol·licitud');
      }
    } catch {
      setError('Error de connexió');
    }
    setProcessingId(null);
  };

  const filteredRequests = requests.filter((req) => {
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    if (filterType !== 'all' && req.requestType !== filterType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        req.requesterEmail.toLowerCase().includes(query) ||
        req.requesterName.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getDaysUntilDeadline = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
      green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
      amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
      yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
      red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
      purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
      orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
      gray: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Gestió de Privacitat</h1>
              <p className="text-gray-400">Sol·licituds ARCO i compliment RGPD</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualitzar
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.requests.pending}</p>
                  <p className="text-sm text-gray-400">Pendents</p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.requests.urgent}</p>
                  <p className="text-sm text-gray-400">Urgents (&lt;5 dies)</p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.requests.completed}</p>
                  <p className="text-sm text-gray-400">Completades</p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.consents.active}</p>
                  <p className="text-sm text-gray-400">Consentiments actius</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Cercar per email o nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="all">Tots els estats</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="all">Tots els tipus</option>
                {Object.entries(REQUEST_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Carregant sol·licituds...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900 border border-white/10 rounded-xl">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hi ha sol·licituds</p>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const typeConfig = REQUEST_TYPE_CONFIG[request.requestType] || REQUEST_TYPE_CONFIG.ACCESS;
              const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
              const daysLeft = getDaysUntilDeadline(request.legalDeadline);
              const isUrgent = daysLeft <= 5 && !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(request.status);
              const isExpanded = expandedId === request.id;
              const TypeIcon = typeConfig.icon;
              const StatusIcon = statusConfig.icon;
              const typeColors = getColorClasses(typeConfig.color);
              const statusColors = getColorClasses(statusConfig.color);

              return (
                <div
                  key={request.id}
                  className={`bg-neutral-900 border rounded-xl overflow-hidden transition-colors ${
                    isUrgent ? 'border-red-500/50' : 'border-white/10'
                  }`}
                >
                  {/* Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : request.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Type Icon */}
                      <div className={`p-2 rounded-lg ${typeColors.bg}`}>
                        <TypeIcon className={`w-5 h-5 ${typeColors.text}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white truncate">
                            {request.requesterName}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${typeColors.bg} ${typeColors.text}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {request.requesterEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(request.createdAt).toLocaleDateString('ca-ES')}
                          </span>
                        </div>
                      </div>

                      {/* Status & Deadline */}
                      <div className="flex items-center gap-4">
                        {/* Deadline */}
                        <div className={`text-right ${isUrgent ? 'text-red-400' : 'text-gray-400'}`}>
                          <div className="text-sm font-medium">
                            {daysLeft > 0 ? `${daysLeft} dies` : 'Vençut!'}
                          </div>
                          <div className="text-xs">
                            {new Date(request.legalDeadline).toLocaleDateString('ca-ES')}
                          </div>
                        </div>

                        {/* Status */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusColors.bg} ${statusColors.border} border`}>
                          <StatusIcon className={`w-3.5 h-3.5 ${statusColors.text}`} />
                          <span className={`text-sm font-medium ${statusColors.text}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Expand */}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-white/10 p-4 bg-black/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Details */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-white">Detalls de la sol·licitud</h4>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">ID:</span>
                              <span className="text-white font-mono text-xs">{request.id}</span>
                            </div>
                            {request.requesterPhone && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Telèfon:</span>
                                <span className="text-white">{request.requesterPhone}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-400">Verificat:</span>
                              <span className="text-white">
                                {request.verifiedAt
                                  ? new Date(request.verifiedAt).toLocaleString('ca-ES')
                                  : 'No'}
                              </span>
                            </div>
                            {request.processedAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Processat:</span>
                                <span className="text-white">
                                  {new Date(request.processedAt).toLocaleString('ca-ES')}
                                </span>
                              </div>
                            )}
                          </div>

                          {request.description && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-400 mb-2">Descripció:</h5>
                              <p className="text-sm text-white bg-white/5 p-3 rounded-lg">
                                {request.description}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-white">Accions</h4>

                          {request.status === 'VERIFIED' && (
                            <div className="space-y-3">
                              <button
                                onClick={() => handleProcess(request.id, 'approve')}
                                disabled={processingId === request.id}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {processingId === request.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Aprovar i processar
                              </button>

                              <button
                                onClick={() => {
                                  const notes = prompt('Motiu del rebuig:');
                                  if (notes) handleProcess(request.id, 'reject', notes);
                                }}
                                disabled={processingId === request.id}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                                Rebutjar
                              </button>
                            </div>
                          )}

                          {request.status === 'PENDING' && (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <p className="text-sm text-yellow-400">
                                Esperant verificació d&apos;identitat per part de l&apos;usuari.
                              </p>
                            </div>
                          )}

                          {request.status === 'COMPLETED' && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                              <p className="text-sm text-green-400">
                                Sol·licitud processada correctament.
                              </p>
                            </div>
                          )}

                          {request.customer && (
                            <div className="mt-4 p-3 bg-white/5 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-400 mb-2">Client vinculat:</h5>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-white">{request.customer.name}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
