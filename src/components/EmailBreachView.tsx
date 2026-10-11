import React, { useState } from 'react';
import { motion } from 'motion/react';
import { EmailBreachIntelligence, PasswordAuditResult } from '../types/osint';
import { auditPasswordKAnonymity } from '../services/emailBreachService';
import { Mail, ShieldAlert, Check, AlertTriangle, KeyRound, Lock, ExternalLink, ShieldCheck, GitBranch } from 'lucide-react';

interface EmailBreachViewProps {
  emailBreach: EmailBreachIntelligence;
  onPivotToGraph?: () => void;
}

export const EmailBreachView: React.FC<EmailBreachViewProps> = ({ emailBreach, onPivotToGraph }) => {
  const [candidatePassword, setCandidatePassword] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<PasswordAuditResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'Tech & Dev', 'Social & Chat', 'Entertainment & Media', 'Shopping & Finance', 'Adult / Privacy'];

  const filteredServices = emailBreach.registered_services.filter(
    (s) => selectedCategory === 'ALL' || s.category === selectedCategory
  );

  const registeredCount = emailBreach.registered_services.filter((s) => s.registered).length;

  const handleAuditPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidatePassword) return;
    setIsAuditing(true);
    try {
      const result = await auditPasswordKAnonymity(candidatePassword);
      setAuditResult(result);
    } catch (err) {
      console.error('k-Anonymity audit failed:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            Email Footprint & Credential Breach Intelligence
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Target: <strong className="text-white font-mono">{emailBreach.email}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Holehe Service Associations: <strong className="text-emerald-400 font-mono">{registeredCount} / {emailBreach.registered_services.length}</strong></span>
            <span aria-hidden="true">·</span>
            <span className={emailBreach.risk_level === 'High' ? 'text-red-400 font-bold' : emailBreach.risk_level === 'Medium' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
              Compromise Risk: {emailBreach.risk_level.toUpperCase()}
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

      {/* Historical Database Breaches */}
      <div className="space-y-3">
        <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              Historical Database Exposures & Breach Records
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Known public data compromises containing confirmed records matching target email address.
            </p>
          </div>
          <span className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
            {emailBreach.breaches.length} Exposures Detected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emailBreach.breaches.map((breach) => (
            <div
              key={breach.name}
              className="p-4 bg-slate-950 rounded-xl border border-red-900/30 space-y-2.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{breach.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">{breach.breach_date}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{breach.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-900 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Compromised Data Categories:</span>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {breach.data_classes.map((cls, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-950/60 border border-red-900/40 text-red-300 rounded font-mono">
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Defensive k-Anonymity Password Auditor */}
      <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              Defensive k-Anonymity Password & Hash Auditor
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Safe password compromise verification via SHA-1 prefixing. The password is never sent over the wire.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
            <Lock className="w-3 h-3" />
            <span>Zero-Knowledge SHA-1 (5 Hex Prefix Only)</span>
          </div>
        </div>

        <form onSubmit={handleAuditPassword} className="flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            value={candidatePassword}
            onChange={(e) => setCandidatePassword(e.target.value)}
            placeholder="Enter candidate password to check against 800M+ pwned hashes..."
            className="flex-1 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
          />
          <button
            type="submit"
            disabled={isAuditing || !candidatePassword}
            className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-2"
          >
            {isAuditing ? <span>Auditing Hash...</span> : <span>Verify via k-Anonymity</span>}
          </button>
        </form>

        {auditResult && (
          <div className={`p-4 rounded-xl border ${auditResult.compromised ? 'bg-red-950/20 border-red-500/30' : 'bg-emerald-950/20 border-emerald-500/30'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {auditResult.compromised ? (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
                <span className={`text-xs font-bold ${auditResult.compromised ? 'text-red-300' : 'text-emerald-300'}`}>
                  {auditResult.compromised
                    ? `Compromised Password: Found ${auditResult.occurrences.toLocaleString()} times in public data breaches!`
                    : 'Clean Password: Not detected in public compromised database dumps.'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Audited prefix: <code className="font-mono text-cyan-300">{auditResult.tested_sha1_prefix}*****</code> · Evaluated {auditResult.suffix_matches} hash range collisions.
              </p>
            </div>
            <div className="text-right text-xs font-mono">
              <span className={auditResult.compromised ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {auditResult.compromised ? 'REUSE PROHIBITED' : 'SECURE STATUS'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Holehe Registered Services Matrix */}
      <div className="space-y-3">
        <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              Registered Accounts Matrix (Holehe Footprint)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Detects account bindings across 30+ services without password reset notifications.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            {registeredCount} Services Bound
          </span>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 max-w-3xl">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedCategory === cat ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {filteredServices.map((svc) => (
            <div
              key={svc.service}
              className={`p-3 rounded-lg border transition flex flex-col justify-between ${
                svc.registered
                  ? 'bg-slate-950 border-emerald-500/40'
                  : 'bg-slate-950/60 border-slate-900 opacity-60'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white truncate">{svc.service}</div>
                <div className="text-[10px] text-slate-500">{svc.category}</div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-900 mt-2">
                <span className={`text-[10px] font-mono ${svc.registered ? 'text-emerald-400 font-semibold' : 'text-slate-600'}`}>
                  {svc.registered ? 'Registered' : 'Not Linked'}
                </span>
                {svc.profile_url && svc.registered && (
                  <a href={svc.profile_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
