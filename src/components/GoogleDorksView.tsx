import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GoogleDork } from '../types/osint';
import { Search, ExternalLink, Copy, Check, Filter, Sparkles, Terminal } from 'lucide-react';

interface GoogleDorksViewProps {
  target: string;
  dorks: GoogleDork[];
}

export const GoogleDorksView: React.FC<GoogleDorksViewProps> = ({ target, dorks }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customOperator, setCustomOperator] = useState<string>('');

  const categories = [
    'ALL',
    'Credentials & Leaks',
    'Profiles & Mentions',
    'Documents & Data',
    'Infrastructure & Configs',
    'Cloud & Repos'
  ];

  const filteredDorks = dorks.filter((d) => {
    return selectedCategory === 'ALL' || d.category === selectedCategory;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customOperator.trim()) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(customOperator.trim())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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
            <Search className="w-4 h-4 text-cyan-400" />
            Google Dorks & Advanced Search Reconnaissance
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Target: <strong className="text-white font-mono">{target}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Generated Advanced Search Operators: <strong className="text-cyan-400 font-mono">{dorks.length}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Passive OSINT Footprinting</span>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click to launch direct targeted Google search</span>
        </div>
      </div>

      {/* Category Filter Pills (Functional Buttons) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 max-w-3xl">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedCategory === cat
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Custom Dork Runner */}
      <form onSubmit={handleCustomSearch} className="flex gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
        <div className="relative flex-1">
          <Terminal className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={customOperator}
            onChange={(e) => setCustomOperator(e.target.value)}
            placeholder={`Custom search operator (e.g. site:pastebin.com "${target}" OR filetype:env)...`}
            className="w-full pl-8 pr-3 py-1 bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={!customOperator.trim()}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <span>Run Custom Dork</span>
          <ExternalLink className="w-3 h-3 text-cyan-400" />
        </button>
      </form>

      {/* Dork Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDorks.map((dork, idx) => (
          <motion.div
            key={dork.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.04 * idx }}
            className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-sans">{dork.title}</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {dork.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                {dork.description}
              </p>
            </div>

            {/* Query Box */}
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 font-mono text-xs text-cyan-300 break-all flex items-start justify-between gap-2">
              <span className="text-[11px] leading-relaxed">{dork.query}</span>
              <button
                type="button"
                onClick={() => handleCopy(dork.query, dork.id)}
                className="shrink-0 p-1 text-slate-400 hover:text-white transition-colors"
                title="Copy query"
              >
                {copiedId === dork.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Launch Search Button */}
            <div className="pt-1 flex justify-end">
              <a
                href={dork.google_search_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-400 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Launch in Google</span>
                <ExternalLink className="w-3 h-3 text-cyan-400" />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
