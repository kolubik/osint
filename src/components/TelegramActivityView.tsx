import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Image,
  Video,
  FileText,
  Radio,
  Search,
  Download,
  ExternalLink,
  Layers,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Archive,
  RefreshCw,
  XCircle,
  Clock,
  Database,
  Lock,
  Unlock,
  Users
} from 'lucide-react';
import { TelegramActivityReport, TelegramChat, TelegramMediaItem, TelegramMessage } from '../types/osint';
import { generateTelegramCanvas, autoVerifyAllTelegramActivity } from '../services/telegramService';

interface TelegramActivityViewProps {
  activity: TelegramActivityReport;
  onFilterChange?: (keywords: string[], mediaTypes: string[]) => void;
  onPivotToGraph?: () => void;
}

export const TelegramActivityView: React.FC<TelegramActivityViewProps> = ({
  activity: initialActivity,
}) => {
  const [activity, setActivity] = useState<TelegramActivityReport>(initialActivity);
  const [activeSubTab, setActiveSubTab] = useState<'chats' | 'messages' | 'media' | 'canvas'>('chats');
  const [searchTerm, setSearchTerm] = useState('');
  const [chatValidityFilter, setChatValidityFilter] = useState<'all' | 'valid' | 'restricted' | 'invalid'>('all');
  const [messageValidityFilter, setMessageValidityFilter] = useState<'all' | 'accessible' | 'inaccessible'>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all');
  const [copiedCanvas, setCopiedCanvas] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditNotification, setAuditNotification] = useState<string | null>(null);
  const [selectedBackupModal, setSelectedBackupModal] = useState<TelegramChat | null>(null);

  // Sync if prop changes
  React.useEffect(() => {
    setActivity(initialActivity);
  }, [initialActivity]);

  // Run live auto-verification audit
  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditNotification(null);
    try {
      const verified = await autoVerifyAllTelegramActivity(activity);
      setActivity(verified);
      const invalidCount = verified.chats.filter((c) => c.join_check_status === 'INVALID_OR_BANNED').length;
      const validCount = verified.chats.filter((c) => c.join_check_status === 'VALID_OPEN').length;
      setAuditNotification(
        `✅ Автопроверка завершена: ${validCount} чатов открыты и доступны, ${invalidCount} невалидных помечены красным с открытыми резервными копиями.`
      );
    } catch (e) {
      setAuditNotification('⚠️ Ошибка при выполнении автопроверки сети.');
    } finally {
      setIsAuditing(false);
      setTimeout(() => setAuditNotification(null), 6000);
    }
  };

  // Filter chats by search and validity status
  const filteredChats = useMemo(() => {
    return activity.chats.filter((chat) => {
      const matchSearch =
        !searchTerm ||
        chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (chat.username && chat.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        chat.chat_id.includes(searchTerm);

      let matchValidity = true;
      if (chatValidityFilter === 'valid') {
        matchValidity = chat.join_check_status === 'VALID_OPEN';
      } else if (chatValidityFilter === 'restricted') {
        matchValidity = chat.join_check_status === 'RESTRICTED';
      } else if (chatValidityFilter === 'invalid') {
        matchValidity = chat.join_check_status === 'INVALID_OR_BANNED';
      }

      return matchSearch && matchValidity;
    });
  }, [activity.chats, searchTerm, chatValidityFilter]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return activity.messages.filter((msg) => {
      const matchSearch =
        !searchTerm ||
        msg.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.chat_title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType =
        selectedMediaType === 'all' ||
        (selectedMediaType === 'text' && !msg.has_media) ||
        (msg.has_media && msg.media_type === selectedMediaType);

      let matchValidity = true;
      if (messageValidityFilter === 'accessible') {
        matchValidity = msg.access_check === 'ACCESSIBLE';
      } else if (messageValidityFilter === 'inaccessible') {
        matchValidity = msg.access_check === 'NOT_FOUND' || !msg.is_verified_accessible;
      }

      return matchSearch && matchType && matchValidity;
    });
  }, [activity.messages, searchTerm, selectedMediaType, messageValidityFilter]);

  // Filter media
  const filteredMedia = useMemo(() => {
    return activity.media_files.filter((med) => {
      const matchSearch =
        !searchTerm ||
        med.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (med.file_name && med.file_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = selectedMediaType === 'all' || med.media_type === selectedMediaType;
      return matchSearch && matchType;
    });
  }, [activity.media_files, searchTerm, selectedMediaType]);

  const handleDownloadCanvas = () => {
    const canvasContent = generateTelegramCanvas(activity);
    const blob = new Blob([canvasContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Telegram_Activity_${activity.target_username}.canvas`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCanvas = () => {
    const canvasContent = generateTelegramCanvas(activity);
    navigator.clipboard.writeText(canvasContent);
    setCopiedCanvas(true);
    setTimeout(() => setCopiedCanvas(false), 2000);
  };

  const downloadBackupJson = (chat: TelegramChat) => {
    if (!chat.backup_data) return;
    const blob = new Blob([JSON.stringify(chat.backup_data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Telegram_Backup_${chat.username || chat.chat_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getMediaBadge = (type: string) => {
    switch (type) {
      case 'video_note':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Radio className="w-3 h-3 animate-pulse" />
            Кружочек (Video Note)
          </span>
        );
      case 'photo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Image className="w-3 h-3" />
            Photo
          </span>
        );
      case 'video':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Video className="w-3 h-3" />
            Video
          </span>
        );
      case 'document':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <FileText className="w-3 h-3" />
            Document
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
            <Layers className="w-3 h-3" />
            File
          </span>
        );
    }
  };

  const validChatsCount = activity.chats.filter((c) => c.join_check_status === 'VALID_OPEN').length;
  const restrictedChatsCount = activity.chats.filter((c) => c.join_check_status === 'RESTRICTED').length;
  const invalidChatsCount = activity.chats.filter((c) => c.join_check_status === 'INVALID_OR_BANNED').length;
  const backupsCount = activity.chats.filter((c) => Boolean(c.backup_data)).length;

  return (
    <div className="space-y-6">
      {/* Top Intelligence Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
              ✈️
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  @{activity.target_username}
                </h2>

                {/* Profile Verification Badge */}
                {activity.profile_is_valid !== false ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Профиль валиден (Активен в MTProto)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-400" />
                    Профиль невалиден / Заблокирован
                  </span>
                )}

                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  {activity.is_telethon_authenticated ? 'Telethon MTProto Userbot' : 'Public Crawler & Web Archive'}
                </span>

                <span className="text-xs font-mono text-slate-400">
                  User ID: <span className="text-slate-200 font-semibold">{activity.target_user_id || 'MTProto Resolved'}</span>
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                <span>{activity.profile_check_details || 'FunStat-grade Telegram Public Chat & Media Ecosystem Analyzer'}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Проверка ссылок...' : '⚡ Автопроверка доступности'}</span>
            </button>

            <a
              href={`https://t.me/${activity.target_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>t.me/{activity.target_username}</span>
            </a>

            <button
              onClick={handleDownloadCanvas}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              title="Экспорт в Obsidian Canvas с красной маркировкой невалидных чатов и сообщений"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Экспорт .canvas</span>
            </button>
          </div>
        </div>

        {/* Audit Notification Toast */}
        {auditNotification && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{auditNotification}</span>
          </motion.div>
        )}

        {/* 4 Status Metric Cards: Valid / Restricted / Invalid (Red) / Backups */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-emerald-500/30 rounded-lg p-3">
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Валидны (Открыты)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-emerald-300">{validChatsCount}</p>
              <span className="text-[11px] text-emerald-500 font-medium">вход и чтение</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-amber-500/30 rounded-lg p-3">
            <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Закрыты (Инвайт)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-amber-300">{restrictedChatsCount}</p>
              <span className="text-[11px] text-amber-500 font-medium">требуют заявки</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border-2 border-rose-500/50 rounded-lg p-3 bg-gradient-to-br from-rose-950/30 to-slate-950">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400" /> Невалидны (Бан/404)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-rose-400">{invalidChatsCount}</p>
              <span className="text-[11px] text-rose-400 font-medium">помечены красным</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-purple-500/30 rounded-lg p-3">
            <span className="text-xs font-medium text-purple-400 flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5 text-purple-400" /> Бэкапы данных
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-purple-300">{backupsCount}</p>
              <span className="text-[11px] text-purple-400 font-medium">открытый архив</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-3">
        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('chats')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'chats'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Публичные чаты ({activity.chats.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('messages')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'messages'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>История сообщений ({filteredMessages.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('media')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'media'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Медиафайлы ({filteredMedia.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('canvas')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'canvas'
                ? 'bg-purple-600 text-white font-bold shadow-sm'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Obsidian Canvas (.canvas)</span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по чатам, тексту или хэшам..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: PUBLIC CHATS & CHANNELS (WITH AUDIT STATUSES & RED INVALID) */}
      {/* ========================================================================= */}
      {activeSubTab === 'chats' && (
        <div className="space-y-4">
          {/* Validity Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-medium">Фильтр валидности:</span>
            <button
              onClick={() => setChatValidityFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                chatValidityFilter === 'all'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              Все чаты ({activity.chats.length})
            </button>
            <button
              onClick={() => setChatValidityFilter('valid')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                chatValidityFilter === 'valid'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 hover:bg-emerald-900/40'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              🟢 Валидные: можно войти ({validChatsCount})
            </button>
            <button
              onClick={() => setChatValidityFilter('restricted')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                chatValidityFilter === 'restricted'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-amber-950/40 text-amber-400 border border-amber-900/40 hover:bg-amber-900/40'
              }`}
            >
              <Lock className="w-3 h-3" />
              🟡 Закрытые: по инвайту ({restrictedChatsCount})
            </button>
            <button
              onClick={() => setChatValidityFilter('invalid')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                chatValidityFilter === 'invalid'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'bg-rose-950/40 text-rose-400 border border-rose-900/40 hover:bg-rose-900/40'
              }`}
            >
              <XCircle className="w-3 h-3" />
              🔴 Невалидные с бэкапом ({invalidChatsCount})
            </button>
          </div>

          {/* Chats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredChats.map((chat) => {
                const isInvalid = chat.join_check_status === 'INVALID_OR_BANNED';
                const isRestricted = chat.join_check_status === 'RESTRICTED';
                const isValid = chat.join_check_status === 'VALID_OPEN';

                return (
                  <motion.div
                    key={chat.chat_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`rounded-xl p-4 flex flex-col justify-between transition-all ${
                      isInvalid
                        ? 'bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-900 border-2 border-rose-500 shadow-xl shadow-rose-950/30'
                        : isRestricted
                        ? 'bg-slate-900 border border-amber-500/40 hover:border-amber-500'
                        : 'bg-slate-900 border border-emerald-500/40 hover:border-emerald-500'
                    }`}
                  >
                    <div>
                      {/* Card Header: Title + Validity Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <MessageSquare
                              className={`w-4 h-4 shrink-0 ${
                                isInvalid ? 'text-rose-400' : isRestricted ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            />
                            <span>{chat.title}</span>
                          </h3>
                          <p className="text-xs text-slate-400 font-mono">
                            ID: <span className="text-slate-300">{chat.chat_id}</span>
                            {chat.username && (
                              <span className="ml-2 text-cyan-400 font-medium">@{chat.username}</span>
                            )}
                          </p>
                        </div>

                        {/* PROMINENT VALIDITY BADGE */}
                        {isInvalid ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border-2 border-rose-500 shadow-sm flex items-center gap-1 shrink-0">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            🔴 НЕВАЛИДЕН
                          </span>
                        ) : isRestricted ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shrink-0">
                            <Lock className="w-3 h-3 text-amber-400" />
                            🟡 ЗАКРЫТ (ИНВАЙТ)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                            <Unlock className="w-3 h-3 text-emerald-400" />
                            🟢 ВАЛИДЕН (ОТКРЫТ)
                          </span>
                        )}
                      </div>

                      {/* Audit Details Banner */}
                      <div
                        className={`mt-3 p-2.5 rounded-lg text-xs leading-relaxed ${
                          isInvalid
                            ? 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
                            : isRestricted
                            ? 'bg-amber-950/40 border border-amber-500/30 text-amber-200'
                            : 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-200'
                        }`}
                      >
                        <p className="font-medium">{chat.access_details}</p>
                        <p className="text-[11px] opacity-80 mt-1">
                          Статус входа: {chat.can_view_history ? '✅ Вход и просмотр разрешены' : '🔒 Просмотр истории заблокирован'}
                        </p>
                      </div>

                      {/* Metadata Details */}
                      <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                        <div className="flex items-center justify-between">
                          <span>Тип сообщества:</span>
                          <span className="text-slate-300 font-medium capitalize">{chat.chat_type}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Участников:</span>
                          <span className="text-slate-200 font-medium flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-500" />
                            {chat.members_count?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* ======================================================= */}
                      {/* ВЫДЕЛЕННЫЙ БЛОК БЭКАПА УСТАРЕВШИХ ДАННЫХ ДЛЯ НЕВАЛИДНЫХ */}
                      {/* ======================================================= */}
                      {chat.backup_data && (
                        <div className="mt-4 p-3.5 rounded-xl border border-rose-500/50 bg-rose-950/30 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                              <Archive className="w-3.5 h-3.5 text-rose-400" />
                              📦 Резервная копия (Открытый архив)
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Снимок: {chat.backup_data.archived_date.slice(0, 10)}
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 space-y-1">
                            <p className="font-semibold text-white">
                              {chat.backup_data.cached_title || chat.title}
                            </p>
                            <p className="text-slate-300 text-[11px] line-clamp-2">
                              {chat.backup_data.cached_description}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                              <span>Источник: <strong className="text-cyan-400">{chat.backup_data.archive_source}</strong></span>
                              <span>Участников в кэше: <strong className="text-white">{chat.backup_data.cached_members_count.toLocaleString()}</strong></span>
                            </div>
                          </div>

                          {/* Cached Sample Messages */}
                          {chat.backup_data.cached_messages_sample && chat.backup_data.cached_messages_sample.length > 0 && (
                            <div className="pt-2 border-t border-rose-500/20 space-y-1">
                              <span className="text-[11px] font-semibold text-slate-400 block">
                                Сохраненные образцы сообщений из архива:
                              </span>
                              {chat.backup_data.cached_messages_sample.map((s, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="text-[11px] font-mono text-slate-300 bg-black/40 px-2 py-1 rounded border border-rose-500/20 truncate"
                                >
                                  {s}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action Buttons for Backup */}
                          <div className="pt-2 flex items-center gap-2">
                            <a
                              href={chat.backup_data.archive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1 px-2.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold rounded-md flex items-center gap-1 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Открыть снимок в Веб-Архиве</span>
                            </a>

                            <button
                              onClick={() => downloadBackupJson(chat)}
                              className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-md border border-slate-700 flex items-center gap-1 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>JSON-дамп</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      {isValid ? (
                        <>
                          <a
                            href={chat.preview_web_url || chat.invite_or_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Войти и просмотреть историю (Web Preview)</span>
                          </a>
                        </>
                      ) : isRestricted ? (
                        <>
                          <a
                            href={chat.invite_or_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-amber-500/40"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Подать заявку на вступление</span>
                          </a>
                        </>
                      ) : (
                        <div className="w-full py-1.5 px-3 bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium rounded-lg text-center">
                          ⚠️ Прямой вход заблокирован · Данные доступны только через бэкап выше
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: MESSAGES HISTORY (WITH VALIDITY BADGES & ARCHIVED DUMPS)      */}
      {/* ========================================================================= */}
      {activeSubTab === 'messages' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-medium">Фильтр сообщений:</span>
            <button
              onClick={() => setMessageValidityFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                messageValidityFilter === 'all'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              Все сообщения ({activity.messages.length})
            </button>
            <button
              onClick={() => setMessageValidityFilter('accessible')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                messageValidityFilter === 'accessible'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 hover:bg-emerald-900/40'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              🟢 Доступные онлайн ({activity.messages.filter((m) => m.access_check === 'ACCESSIBLE').length})
            </button>
            <button
              onClick={() => setMessageValidityFilter('inaccessible')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                messageValidityFilter === 'inaccessible'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'bg-rose-950/40 text-rose-400 border border-rose-900/40 hover:bg-rose-900/40'
              }`}
            >
              <XCircle className="w-3 h-3" />
              🔴 Из заблокированных чатов (Бэкап) ({activity.messages.filter((m) => m.access_check === 'NOT_FOUND' || !m.is_verified_accessible).length})
            </button>
          </div>

          <div className="space-y-3">
            {filteredMessages.map((msg) => {
              const isInaccessible = msg.access_check === 'NOT_FOUND' || !msg.is_verified_accessible;
              const isRestricted = msg.access_check === 'RESTRICTED_CHAT';

              return (
                <div
                  key={`${msg.chat_id}_${msg.message_id}`}
                  className={`rounded-xl p-4 transition-colors ${
                    isInaccessible
                      ? 'bg-gradient-to-r from-rose-950/30 to-slate-900 border-2 border-rose-500/70 shadow-md'
                      : isRestricted
                      ? 'bg-slate-900 border border-amber-500/30'
                      : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        💬 {msg.chat_title}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">#{msg.message_id}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Validity Status Badge on Message */}
                      {isInaccessible ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          🔴 НЕВАЛИДНО: ЧАТ ЗАБЛОКИРОВАН
                        </span>
                      ) : isRestricted ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-400" />
                          🟡 ЗАКРЫТЫЙ ЧАТ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          🟢 ДОСТУПНО ОНЛАЙН
                        </span>
                      )}

                      {msg.has_media && msg.media_type && getMediaBadge(msg.media_type)}
                      <span className="text-xs text-slate-400 font-mono">
                        {msg.date.replace('T', ' ').slice(0, 19)} UTC
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Message Backup Notice if Invalid */}
                  {msg.backup_data && (
                    <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Archive className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Восстановлено из открытого архива: <strong>{msg.backup_data.archive_source}</strong> ({msg.backup_data.archived_date})</span>
                      </div>
                      <a
                        href={msg.backup_data.archive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold underline shrink-0"
                      >
                        <span>Архив</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {msg.media_item && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {getMediaBadge(msg.media_item.media_type)}
                        <span className="text-xs text-slate-300">
                          {msg.media_item.file_name || msg.media_item.caption || 'Attachment'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          ({msg.media_item.file_size_human})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        SHA256: {msg.media_item.file_sha256.slice(0, 12)}...
                      </span>
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 truncate max-w-[400px]">
                      Ссылка: <code className="text-slate-400">{msg.message_url}</code>
                    </span>
                    {!isInaccessible ? (
                      <a
                        href={msg.message_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                      >
                        <span>Открыть в Telegram</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-rose-400 font-medium">Ссылка недоступна онлайн</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: MEDIA VAULT                                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'media' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              Найдено {filteredMedia.length} медиавложений (фото, видео, кружочки, дампы). Все файлы связаны с исходными чатами.
            </p>
            <select
              value={selectedMediaType}
              onChange={(e) => setSelectedMediaType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Все форматы</option>
              <option value="photo">Фотографии</option>
              <option value="video">Видео</option>
              <option value="video_note">Кружочки (Video Notes)</option>
              <option value="document">Документы и архивы</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredMedia.map((med, idx) => (
                <motion.div
                  key={med.media_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {getMediaBadge(med.media_type)}
                      <span className="text-[11px] font-mono text-slate-400">
                        {med.file_size_human}
                      </span>
                    </div>

                    {med.file_name && (
                      <p className="text-xs font-semibold text-white truncate" title={med.file_name}>
                        📁 {med.file_name}
                      </p>
                    )}

                    <p className="text-xs text-slate-300 mt-1 italic line-clamp-2">
                      "{med.caption || 'Без подписи'}"
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>Чат:</span>
                        <span className="text-cyan-400 font-medium truncate max-w-[170px]">
                          @{med.chat_username || 'private_group'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Дата:</span>
                        <span className="text-slate-300">{med.date.replace('T', ' ').slice(0, 19)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>SHA-256:</span>
                        <span className="font-mono text-[10px] text-slate-500 truncate max-w-[170px]" title={med.file_sha256}>
                          {med.file_sha256.slice(0, 16)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    <a
                      href={med.direct_message_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Перейти к сообщению</span>
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: OBSIDIAN CANVAS GENERATOR (.canvas)                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'canvas' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-400" />
                Obsidian Canvas Knowledge Graph (.canvas)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Автоматическая разметка графа: невалидные чаты и сообщения выделяются <strong>КРАСНЫМ ЦВЕТОМ (Цвет "1")</strong> с блоком архивного бэкапа. Валидные открытые чаты — <strong>ЗЕЛЕНЫМ (Цвет "4")</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCanvas}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedCanvas ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Layers className="w-3.5 h-3.5" />}
                <span>{copiedCanvas ? 'Скопировано!' : 'Скопировать JSON'}</span>
              </button>

              <button
                onClick={handleDownloadCanvas}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать .canvas файл</span>
              </button>
            </div>
          </div>

          {/* Color Legend Card */}
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
              <span className="text-slate-300">Цвет 1: Невалидный / Бэкап</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-300">Цвет 4: Валиден (Открытый вход)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-300">Цвет 3: Закрытый (Инвайт)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500 shrink-0" />
              <span className="text-slate-300">Цвет 5 / 6: Профиль и Медиа</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto">
            <pre>{generateTelegramCanvas(activity)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
