import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  MessageSquare,
  Image,
  Video,
  FileText,
  Radio,
  Search,
  Filter,
  Download,
  ExternalLink,
  Layers,
  ShieldCheck,
  Hash,
  Calendar,
  Eye,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { TelegramActivityReport, TelegramMediaItem, TelegramMessage } from '../types/osint';
import { generateTelegramCanvas } from '../services/telegramService';

interface TelegramActivityViewProps {
  activity: TelegramActivityReport;
  onFilterChange?: (keywords: string[], mediaTypes: string[]) => void;
  onPivotToGraph?: () => void;
}

export const TelegramActivityView: React.FC<TelegramActivityViewProps> = ({
  activity,
  onPivotToGraph,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'media' | 'messages' | 'chats' | 'canvas'>('media');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all');
  const [copiedCanvas, setCopiedCanvas] = useState(false);

  // Filter messages and media based on user inputs
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
      return matchSearch && matchType;
    });
  }, [activity.messages, searchTerm, selectedMediaType]);

  const filteredMedia = useMemo(() => {
    return activity.media_files.filter((med) => {
      const matchSearch =
        !searchTerm ||
        med.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (med.file_name && med.file_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType =
        selectedMediaType === 'all' || med.media_type === selectedMediaType;
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

  return (
    <div className="space-y-6">
      {/* Top Intelligence Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
              ✈️
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  @{activity.target_username}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  {activity.is_telethon_authenticated ? 'Telethon MTProto Active' : 'Public Ecosystem Crawler'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  ID: <span className="text-slate-200">{activity.target_user_id || 'Indexed'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                FunStat-grade Telegram Public Chat & Media Activity Analysis · Zero AI Hallucination
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href={`https://t.me/${activity.target_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>t.me/{activity.target_username}</span>
            </a>

            <button
              onClick={handleDownloadCanvas}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .canvas</span>
            </button>
          </div>
        </div>

        {/* Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Public Chats
            </span>
            <p className="text-xl font-bold text-white mt-1">{activity.total_chats_found}</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Messages Parsed
            </span>
            <p className="text-xl font-bold text-white mt-1">{activity.total_messages_found}</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" /> Media Files
            </span>
            <p className="text-xl font-bold text-emerald-300 mt-1">{activity.total_media_found}</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-purple-400" /> Video Notes (Кружочки)
            </span>
            <p className="text-xl font-bold text-purple-300 mt-1">
              {activity.activity_summary.media_breakdown.video_notes_rounds}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and View Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-3">
        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('media')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'media'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Media Vault ({filteredMedia.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('messages')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'messages'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Messages History ({filteredMessages.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('chats')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'chats'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Public Chats ({activity.chats.length})</span>
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
            <span>Obsidian Canvas</span>
          </button>
        </div>

        {/* Search & Media Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by keyword or chat..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={selectedMediaType}
            onChange={(e) => setSelectedMediaType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Media</option>
            <option value="photo">Photos</option>
            <option value="video">Videos</option>
            <option value="video_note">Кружочки (Video Notes)</option>
            <option value="document">Documents</option>
          </select>
        </div>
      </div>

      {/* SUB-VIEW 1: MEDIA VAULT */}
      {activeSubTab === 'media' && (
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
                    "{med.caption || 'No caption provided'}"
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Chat:</span>
                      <span className="text-cyan-400 font-medium truncate max-w-[170px]">
                        @{med.chat_username || 'private_group'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Timestamp:</span>
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
                    <span>View in Telegram</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* SUB-VIEW 2: MESSAGES HISTORY */}
      {activeSubTab === 'messages' && (
        <div className="space-y-3">
          {filteredMessages.map((msg, idx) => (
            <div
              key={`${msg.chat_id}_${msg.message_id}`}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    💬 {msg.chat_title}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">#{msg.message_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  {msg.has_media && msg.media_type && getMediaBadge(msg.media_type)}
                  <span className="text-xs text-slate-400">
                    {msg.date.replace('T', ' ').slice(0, 19)} UTC
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </p>

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
                <span className="text-[11px] text-slate-500">
                  Direct post URL: <code className="text-slate-400">{msg.message_url}</code>
                </span>
                <a
                  href={msg.message_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <span>Open Message</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-VIEW 3: PUBLIC CHATS & CHANNELS */}
      {activeSubTab === 'chats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activity.chats.map((chat) => (
            <div
              key={chat.chat_id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    {chat.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {chat.chat_type}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Chat ID:</span>
                    <span className="font-mono text-slate-300">{chat.chat_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Username:</span>
                    <span className="text-cyan-400 font-medium">
                      @{chat.username || 'private_channel'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Members:</span>
                    <span className="text-slate-200 font-medium">
                      {chat.members_count?.toLocaleString() || 'Public Group'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <a
                  href={chat.invite_or_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Join / Inspect Chat</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-VIEW 4: OBSIDIAN CANVAS GENERATOR */}
      {activeSubTab === 'canvas' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-400" />
                Obsidian Canvas Knowledge Graph (.canvas)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Visualizes bi-directional attribution: User Profile → Public Chats → Sent Messages → Media Attachments with arrows.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCanvas}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedCanvas ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Layers className="w-3.5 h-3.5" />}
                <span>{copiedCanvas ? 'Copied JSON' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={handleDownloadCanvas}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .canvas File</span>
              </button>
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
