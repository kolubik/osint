import React from 'react';
import { Download, LayoutGrid } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExport: () => void;
  onExportObsidian: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onExport, onExportObsidian }) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
      {/* Zone 1: Single text wordmark */}
      <a 
        href="#" 
        onClick={(e) => { e.preventDefault(); setActiveTab('console'); }}
        className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
      >
        <span className="w-2.5 h-2.5 bg-cyan-400 rounded-xs"></span>
        Spectre OSINT Suite
      </a>

      {/* Zone 2: Clean single-line nav links */}
      <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-400 overflow-x-auto">
        <button
          onClick={() => setActiveTab('console')}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'console' ? 'text-white border-b-2 border-cyan-400' : ''
          }`}
        >
          Console
        </button>
        <button
          onClick={() => setActiveTab('entities')}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'entities' ? 'text-white border-b-2 border-cyan-400' : ''
          }`}
        >
          Profiles
        </button>
        <button
          onClick={() => setActiveTab('telegram')}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'telegram' ? 'text-white border-b-2 border-cyan-400' : ''
          }`}
        >
          Telegram OSINT
        </button>
        <button
          onClick={() => setActiveTab('phone')}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'phone' ? 'text-white border-b-2 border-cyan-400' : ''
          }`}
        >
          Phone OSINT
        </button>
        <button
          onClick={() => setActiveTab('breaches')}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'breaches' ? 'text-white border-b-2 border-cyan-400' : ''
          }`}
        >
          Breaches & Leaks
        </button>
        <button
          onClick={() => setActiveTab('dorks')}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'dorks' ? 'text-white border-b-2 border-cyan-400' : ''
          }`}
        >
          Google Dorks
        </button>
        <button
          onClick={() => setActiveTab('technical')}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'technical' ? 'text-white border-b-2 border-cyan-400' : ''
          }`}
        >
          Infrastructure
        </button>
        <button
          onClick={() => setActiveTab('geoint')}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'geoint' ? 'text-white border-b-2 border-cyan-400' : ''
          }`}
        >
          GEOINT
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'graph' ? 'text-white border-b-2 border-cyan-400' : ''
          }`}
        >
          Logic Chain
        </button>
        <button
          onClick={() => setActiveTab('obsidian')}
          className={`hover:text-purple-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'obsidian' ? 'text-purple-300 border-b-2 border-purple-400' : ''
          }`}
        >
          Obsidian Export
        </button>
        <button
          onClick={() => setActiveTab('python')}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'python' ? 'text-white border-b-2 border-cyan-400' : ''
          }`}
        >
          Linux Mint & Docker
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onExportObsidian}
          className="px-3.5 py-1.5 text-xs font-semibold text-purple-200 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
          <span>Obsidian Export</span>
        </button>

        <button
          onClick={onExport}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>JSON</span>
        </button>
      </div>
    </header>
  );
};
