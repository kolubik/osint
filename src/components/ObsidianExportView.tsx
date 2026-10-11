import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ScanReport } from '../types/osint';
import { generateObsidianMarkdown, generateObsidianCanvas } from '../services/obsidianExport';
import { FileText, LayoutGrid, Download, Copy, Check, Info, Sparkles } from 'lucide-react';

interface ObsidianExportViewProps {
  report: ScanReport;
}

export const ObsidianExportView: React.FC<ObsidianExportViewProps> = ({ report }) => {
  const [activeFormat, setActiveFormat] = useState<'markdown' | 'canvas'>('markdown');
  const [copied, setCopied] = useState(false);

  const markdownContent = generateObsidianMarkdown(report);
  const canvasContent = generateObsidianCanvas(report);

  const activeContent = activeFormat === 'markdown' ? markdownContent : canvasContent;
  const activeFileName = activeFormat === 'markdown' 
    ? `OSINT_Dossier_${report.target}.md` 
    : `OSINT_Graph_${report.target}.canvas`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const mimeType = activeFormat === 'markdown' ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8';
    const blob = new Blob([activeContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-purple-400" />
            Obsidian Second Brain & Canvas Export Engine
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Target: <strong className="text-white font-mono">{report.target}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Formats: Native Markdown (.md) & Interactive Canvas (.canvas)</span>
            <span aria-hidden="true">·</span>
            <span>Zero-dependency import to any Obsidian Vault</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Content'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {activeFileName}</span>
          </button>
        </div>
      </div>

      {/* Format Selector Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-lg max-w-md border border-slate-800">
        <button
          onClick={() => setActiveFormat('markdown')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeFormat === 'markdown'
              ? 'bg-purple-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Obsidian Markdown (.md)</span>
        </button>

        <button
          onClick={() => setActiveFormat('canvas')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeFormat === 'canvas'
              ? 'bg-purple-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Obsidian Canvas (.canvas)</span>
        </button>
      </div>

      {/* Info Callout */}
      <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-lg flex items-start gap-2.5 text-xs text-purple-200">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold text-white">
            {activeFormat === 'markdown' ? 'Obsidian Markdown Dossier Features:' : 'Obsidian Canvas JSON Graph Features:'}
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {activeFormat === 'markdown'
              ? 'Includes YAML frontmatter with tags, [[Target]] bi-directional wikilinks, checklists of verified accounts, tables of data breaches, and recommended Google Dorks.'
              : 'Directly compatible with Obsidian Canvas (.canvas). Preserves 100% of discovered data without omission: all verified profiles, all Holehe registered accounts, every telephone messenger (Telegram, WhatsApp, etc.), telecom DEF registry, leaks, and infrastructure.'}
          </p>
        </div>
      </div>

      {/* Live Code Preview */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{activeFileName}</span>
          <span>{activeFormat === 'markdown' ? 'Markdown Document' : 'JSON Canvas Spec'}</span>
        </div>
        <pre className="p-4 text-xs font-mono text-slate-300 max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
          {activeContent}
        </pre>
      </div>
    </motion.div>
  );
};
