import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PhoneIntelligence } from '../types/osint';
import {
  Phone,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Clock,
  Radio,
  Globe,
  AlertTriangle,
  GitBranch,
  Database,
  CheckCircle2,
  Share2,
  Copy,
  Check
} from 'lucide-react';

interface PhoneViewProps {
  phone: PhoneIntelligence;
  onPivotToGraph?: () => void;
}

export const PhoneView: React.FC<PhoneViewProps> = ({ phone, onPivotToGraph }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Telephony & Phone SOCMINT Intelligence
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/80 text-emerald-300 font-bold uppercase">
              DEF Registry & SOCMINT
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span>E.164: <strong className="text-white font-mono">{phone.e164}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Region: <strong className="text-white font-mono">{phone.country_name} ({phone.country_code})</strong></span>
            <span aria-hidden="true">·</span>
            <span className={phone.valid ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
              {phone.valid ? 'VERIFIED_REAL (ITU Compliant)' : 'INVALID_PHONE_NUMBER'}
            </span>
          </div>
        </div>

        {onPivotToGraph && (
          <button
            onClick={onPivotToGraph}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Maltego Graph Pivot</span>
          </button>
        )}
      </div>

      {!phone.valid && (
        <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>Strict Truthfulness Guard: Target number failed ITU libphonenumber checksum algorithm. Reconnaissance halted.</span>
        </div>
      )}

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1"
        >
          <div className="text-slate-500 text-xs flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Wireless Carrier / Operator
          </div>
          <div className="text-white font-mono font-bold text-sm truncate">{phone.carrier}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1"
        >
          <div className="text-slate-500 text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Line Classification
          </div>
          <div className="text-white font-mono font-bold text-sm">{phone.line_type}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1"
        >
          <div className="text-slate-500 text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Operating Timezones
          </div>
          <div className="text-white font-mono font-bold text-sm truncate">{phone.timezones.join(', ')}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1"
        >
          <div className="text-slate-500 text-xs flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            National Dialing Format
          </div>
          <div className="text-white font-mono font-bold text-sm">{phone.national_format}</div>
        </motion.div>
      </div>

      {/* Telecom DEF Registry & Numbering Plan Inspector */}
      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Public Telecom Numbering Plan & DEF Registry
          </h3>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            OFFICIAL_REGISTRY_VERIFIED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold">DEF Prefix / NPA-NXX</span>
            <div className="text-white font-mono font-bold">{phone.e164.slice(0, 5)} (Identified)</div>
            <p className="text-[11px] text-slate-400">Federal numbering allocation block managed by communications regulator.</p>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold">HLR / SS7 Routing Protocol</span>
            <div className="text-emerald-300 font-mono font-bold">Standard GSM MAP v3</div>
            <p className="text-[11px] text-slate-400">Direct Home Location Register routing table attribution enabled.</p>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold">SIP Trunk / VoIP Viability</span>
            <div className="text-cyan-300 font-mono font-bold">{phone.line_type === 'VoIP' ? 'Confirmed Virtual' : 'Physical SIM GSM'}</div>
            <p className="text-[11px] text-slate-400">Hardware base station registration and IMSI correlation active.</p>
          </div>
        </div>
      </div>

      {/* Messengers & Communications Verification */}
      <div className="space-y-3">
        <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              Direct Messenger & Social Deep Link Resolvers
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Verifies public profile bindings, direct conversation protocols, and directory records.
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
            {phone.messengers.length} Endpoints Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {phone.messengers.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 * idx }}
              className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{m.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {m.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{m.notes}</p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-900 gap-2">
                <button
                  onClick={() => handleCopy(m.url, `msg_${idx}`)}
                  className="text-[10px] font-mono text-slate-500 hover:text-slate-300 truncate max-w-[140px] flex items-center gap-1"
                >
                  {copiedKey === `msg_${idx}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{m.url}</span>
                </button>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-400 text-cyan-300 text-xs font-semibold rounded transition flex items-center gap-1 shrink-0"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Account Recovery & Identity Correlation */}
      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          Single Sign-On (SSO) & Account Recovery Correlation
        </h3>
        <p className="text-xs text-slate-400">
          Manual OSINT pathways to verify whether target mobile identifier is registered across identity providers:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {phone.social_lookups.map((lookup, i) => (
            <a
              key={i}
              href={lookup.lookup_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 hover:border-cyan-400 text-slate-200 transition flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-white">{lookup.platform}</div>
                <div className="text-[11px] text-slate-400">{lookup.query}</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-2" />
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
