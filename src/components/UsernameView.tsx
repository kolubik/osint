import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EntityResult } from '../types/osint';
import {
  Check,
  ExternalLink,
  Search,
  User,
  Filter,
  AlertCircle,
  ShieldCheck,
  Zap,
  Loader2,
  Info,
  RefreshCw,
  Globe,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';
import { clarifyProfileViaApi, ClarificationDetail } from '../services/profileApiService';

interface UsernameViewProps {
  target: string;
  entities: EntityResult[];
  onEntityUpdated?: (updated: EntityResult) => void;
  onPivotToTelegram?: () => void;
}

export const UsernameView: React.FC<UsernameViewProps> = ({
  target,
  entities,
  onEntityUpdated,
  onPivotToTelegram
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FOUND' | 'CLARIFIED' | 'UNVERIFIED'>('ALL');
  
  // Per-item clarification loading state: { [serviceName]: boolean }
  const [clarifyingMap, setClarifyingMap] = useState<Record<string, boolean>>({});
  
  // Batch clarification state
  const [isBatchClarifying, setIsBatchClarifying] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Inspection modal state for viewing exact API proof
  const [selectedProof, setSelectedProof] = useState<{
    item: EntityResult;
    detail?: ClarificationDetail;
  } | null>(null);

  const foundCount = entities.filter((e) => e.status === 'Found').length;
  const clarifiedCount = entities.filter((e) => e.api_clarified || e.verification_status === 'API_VERIFIED' || e.verification_status === 'CLARIFIED_VIA_API').length;
  const unverifiedCount = entities.filter((e) => e.status !== 'Found').length;

  const categories = ['ALL', 'Developer', 'Social', 'Gaming', 'Content', 'Profile', 'Archive'];

  // Handle single item clarification via API
  const handleClarifyItem = async (item: EntityResult) => {
    if (clarifyingMap[item.service_name]) return;
    setClarifyingMap((prev) => ({ ...prev, [item.service_name]: true }));

    try {
      const result = await clarifyProfileViaApi(item.service_name, target);

      const updated: EntityResult = {
        ...item,
        status: result.isFound ? 'Found' : 'Not Found',
        verification_status: result.isFound ? 'CLARIFIED_VIA_API' : 'NOT_FOUND',
        api_clarified: true,
        api_endpoint: result.apiEndpoint,
        http_status: result.statusCode,
        clarification_notes: result.evidence,
        response_time_ms: result.latencyMs,
        source_tag: result.methodUsed.toUpperCase().replace(/\s+/g, '_'),
        metadata: {
          ...(item.metadata || {}),
          ...(result.metadata || {}),
          avatar_url: result.avatarUrl || item.metadata?.avatar_url,
          evidence: result.evidence,
          methodUsed: result.methodUsed,
          rawSnippet: result.rawSnippet
        }
      };

      if (onEntityUpdated) {
        onEntityUpdated(updated);
      }

      // Automatically show proof dialog if clarified as Found
      if (result.isFound) {
        setSelectedProof({ item: updated, detail: result });
      }
    } catch (err) {
      console.error('Clarification error:', err);
    } finally {
      setClarifyingMap((prev) => ({ ...prev, [item.service_name]: false }));
    }
  };

  // Handle batch clarification across unverified/not-found platforms
  const handleClarifyAll = async () => {
    if (isBatchClarifying) return;
    const targetsToClarify = entities.filter((e) => e.status !== 'Found' || !e.api_clarified);
    if (targetsToClarify.length === 0) return;

    setIsBatchClarifying(true);
    setBatchProgress({ current: 0, total: targetsToClarify.length });

    for (let i = 0; i < targetsToClarify.length; i++) {
      const item = targetsToClarify[i];
      setBatchProgress({ current: i + 1, total: targetsToClarify.length });
      setClarifyingMap((prev) => ({ ...prev, [item.service_name]: true }));

      try {
        const result = await clarifyProfileViaApi(item.service_name, target);
        if (result.isFound) {
          const updated: EntityResult = {
            ...item,
            status: 'Found',
            verification_status: 'CLARIFIED_VIA_API',
            api_clarified: true,
            api_endpoint: result.apiEndpoint,
            http_status: result.statusCode,
            clarification_notes: result.evidence,
            response_time_ms: result.latencyMs,
            source_tag: result.methodUsed.toUpperCase().replace(/\s+/g, '_'),
            metadata: {
              ...(item.metadata || {}),
              ...(result.metadata || {}),
              avatar_url: result.avatarUrl,
              evidence: result.evidence,
              methodUsed: result.methodUsed
            }
          };
          if (onEntityUpdated) {
            onEntityUpdated(updated);
          }
        }
      } catch (e) {
        console.warn(`Error clarifying ${item.service_name}:`, e);
      } finally {
        setClarifyingMap((prev) => ({ ...prev, [item.service_name]: false }));
      }
    }

    setIsBatchClarifying(false);
  };

  const filtered = entities.filter((item) => {
    const matchesSearch =
      item.service_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.target_url.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'FOUND') matchesStatus = item.status === 'Found';
    if (statusFilter === 'CLARIFIED') matchesStatus = Boolean(item.api_clarified || item.verification_status === 'CLARIFIED_VIA_API');
    if (statusFilter === 'UNVERIFIED') matchesStatus = item.status !== 'Found';

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6"
    >
      {/* Overview Metric Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Social & Profile OSINT Records
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              API Verification Engine
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Target: <strong className="text-white font-mono">{target}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Probed: <strong className="text-white tabular-nums font-mono">{entities.length}</strong></span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-semibold">
              Active Profiles: <span className="tabular-nums font-mono">{foundCount}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400 font-semibold">
              Clarified via API: <span className="tabular-nums font-mono">{clarifiedCount}</span>
            </span>
          </div>
        </div>

        {/* Global Action: Clarify All via API */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleClarifyAll}
            disabled={isBatchClarifying || unverifiedCount === 0}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border shadow-lg ${
              isBatchClarifying
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700 animate-pulse'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-500/50 shadow-cyan-950/40'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Запустить глубокую верификацию через официальные REST/JSON API и DOM-сигнатуры для всех ненайденных сервисов"
          >
            {isBatchClarifying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Уточнение через API ({batchProgress.current}/{batchProgress.total})...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-cyan-300" />
                <span>Уточнить все через API ({unverifiedCount})</span>
              </>
            )}
          </button>

          {onPivotToTelegram && (
            <button
              onClick={onPivotToTelegram}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 shadow-sm transition-all flex items-center gap-1.5"
              title="Перейти к анализу открытых чатов, сообщений и медиа в экосистеме Telegram"
            >
              <span>✈️ Telegram OSINT</span>
            </button>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter services..."
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Clarification Guidance Banner */}
      <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-slate-300 leading-relaxed">
            <strong className="text-white">Устранение ложных отрицаний (Anti-False-Negative):</strong> Если профиль существует, но сервис заблокирован защитой от ботов или возвращает мягкий 404, используйте кнопку <strong className="text-cyan-400">«Уточнить через API»</strong> для прямого запроса к официальным API шлюзам (GitHub, GitLab, Reddit, Chess.com, Mastodon, Bluesky, Telegram и др.).
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            {foundCount} подтверждено / {entities.length} всего
          </span>
        </div>
      </div>

      {/* Filter Tabs: Category & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-800 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded transition-colors ${
              statusFilter === 'ALL' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Все ({entities.length})
          </button>
          <button
            onClick={() => setStatusFilter('FOUND')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              statusFilter === 'FOUND' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Check className="w-3 h-3 text-emerald-400" />
            Найдены ({foundCount})
          </button>
          <button
            onClick={() => setStatusFilter('CLARIFIED')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              statusFilter === 'CLARIFIED' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            Уточнено API ({clarifiedCount})
          </button>
          <button
            onClick={() => setStatusFilter('UNVERIFIED')}
            className={`px-2.5 py-1 rounded transition-colors ${
              statusFilter === 'UNVERIFIED' ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Не подтверждены ({unverifiedCount})
          </button>
        </div>
      </div>

      {/* Main Entities Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <th className="py-2.5 px-3">Service</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Profile Link</th>
              <th className="py-2.5 px-3 text-right">Latency</th>
              <th className="py-2.5 px-3">API Verification & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500 font-sans">
                  No matching services found for this filter.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
                const isClarifying = clarifyingMap[item.service_name];
                const isFound = item.status === 'Found';
                const isClarified = item.api_clarified || item.verification_status === 'CLARIFIED_VIA_API' || item.verification_status === 'API_VERIFIED';

                return (
                  <tr
                    key={`${item.service_name}-${idx}`}
                    className={`transition-colors ${
                      isFound ? 'bg-slate-950/30 hover:bg-slate-950/60' : 'hover:bg-slate-950/30'
                    }`}
                  >
                    {/* Service Name + Avatar */}
                    <td className="py-2.5 px-3 font-sans font-medium text-white flex items-center gap-2">
                      {item.metadata?.avatar_url ? (
                        <img
                          src={item.metadata.avatar_url}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-cyan-500/40"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
                          {item.service_name.charAt(0)}
                        </div>
                      )}
                      <span>{item.service_name}</span>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3 text-slate-400 font-sans">{item.category}</td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 font-sans">
                      {isFound ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Found
                          </span>
                          {isClarified && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5 text-cyan-400" />
                              API Verified
                            </span>
                          )}
                        </div>
                      ) : item.status === 'Rate Limited' ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> 429 Limit
                        </span>
                      ) : item.verification_status === 'UNREACHABLE' ? (
                        <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          Unverified
                        </span>
                      ) : (
                        <span className="text-slate-600 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-slate-600" />
                          Not Found
                        </span>
                      )}
                    </td>

                    {/* Target Profile URL */}
                    <td className="py-2.5 px-3">
                      <a
                        href={item.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                      >
                        <span className="truncate max-w-[200px]">{item.target_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>

                    {/* Latency */}
                    <td className="py-2.5 px-3 text-right text-slate-400 tabular-nums">
                      {item.response_time_ms}ms
                    </td>

                    {/* API Verification & Actions Column */}
                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex items-center gap-1.5">
                        {/* Action: Clarify via API */}
                        <button
                          onClick={() => handleClarifyItem(item)}
                          disabled={isClarifying}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 border ${
                            isClarifying
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-700 animate-pulse cursor-wait'
                              : isFound
                              ? 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                              : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}
                          title="Проверить и уточнить наличие профиля через прямой вызов API и валидацию ответов"
                        >
                          {isClarifying ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                              <span>Уточняем...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 text-cyan-400" />
                              <span>{isFound ? 'Повторить API' : 'Уточнить через API'}</span>
                            </>
                          )}
                        </button>

                        {/* View Proof Info */}
                        {(isClarified || item.clarification_notes) && (
                          <button
                            onClick={() => setSelectedProof({ item })}
                            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                            title="Посмотреть доказательство и заголовки API"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Instant Google Dork for target on this site */}
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(
                            `site:${new URL(item.target_url).hostname} "${target}"`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded text-slate-500 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                          title={`Поиск Google Dork: site:${new URL(item.target_url).hostname} "${target}"`}
                        >
                          <Search className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Proof & Clarification Details Modal */}
      <AnimatePresence>
        {selectedProof && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">
                    API Verification Proof: {selectedProof.item.service_name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedProof(null)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-400 font-medium">Status Verdict:</div>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedProof.item.status === 'Found' ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Active Profile Confirmed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-slate-500" /> Not Found / Absent
                      </span>
                    )}
                    <span className="font-mono text-slate-400">
                      HTTP {selectedProof.item.http_status || 200}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-medium">Probed Endpoint:</div>
                  <div className="font-mono text-cyan-400 bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
                    {selectedProof.item.api_endpoint || selectedProof.item.target_url}
                  </div>
                </div>

                {selectedProof.item.clarification_notes && (
                  <div>
                    <div className="text-slate-400 font-medium">Evidence Signature:</div>
                    <div className="text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800 leading-relaxed">
                      {selectedProof.item.clarification_notes}
                    </div>
                  </div>
                )}

                {selectedProof.item.metadata && Object.keys(selectedProof.item.metadata).length > 0 && (
                  <div>
                    <div className="text-slate-400 font-medium">Extracted Profile Metadata:</div>
                    <pre className="font-mono text-[11px] bg-slate-950 text-slate-300 p-2.5 rounded border border-slate-800 overflow-x-auto max-h-40">
                      {JSON.stringify(selectedProof.item.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <a
                    href={selectedProof.item.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Open Direct Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => setSelectedProof(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
