import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TargetType } from '../types/osint';
import { User, Globe, Camera, Mail, Phone, ArrowRight, Upload, Sparkles } from 'lucide-react';

interface ConsoleInputProps {
  onScan: (type: TargetType, value: string | File) => Promise<void>;
  isLoading: boolean;
}

export const ConsoleInput: React.FC<ConsoleInputProps> = ({ onScan, isLoading }) => {
  const [selectedType, setSelectedType] = useState<TargetType>('USERNAME');
  const [inputValue, setInputValue] = useState('torvalds');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const presets: Record<TargetType, string[]> = {
    USERNAME: ['torvalds', 'durov', 'dhh', 'vitalik', 'antirez', 'sama'],
    DOMAIN: ['github.com', 'cloudflare.com', '1.1.1.1', '8.8.8.8', 'kernel.org'],
    IP: ['1.1.1.1', '8.8.8.8', '9.9.9.9'],
    EMAIL: ['linus@kernel.org', 'satya.nadella@microsoft.com', 'security@google.com', 'test@example.com'],
    PHONE: ['+14155552671', '+447911123456', '+79991234567', '+491512345678', '+33612345678'],
    IMAGE_EXIF: []
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType === 'IMAGE_EXIF') {
      if (selectedFile) {
        await onScan('IMAGE_EXIF', selectedFile);
      }
    } else {
      if (inputValue.trim()) {
        await onScan(selectedType, inputValue.trim());
      }
    }
  };

  const loadSampleGeoint = async (sampleName: string, lat: number, lon: number, locationName: string) => {
    const blob = new Blob(['sample-image-data'], { type: 'image/jpeg' });
    const sampleFile = new File([blob], `${sampleName}.jpg`, { type: 'image/jpeg' });
    (sampleFile as any).sampleCoords = { lat, lon, locationName };
    setSelectedFile(sampleFile);
    await onScan('IMAGE_EXIF', sampleFile);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Reconnaissance Target Console</h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous multi-vector intelligence: Social identities, Phone SOCMINT, HIBP & Holehe breaches, Google Dorks, DNS/BGP, and EXIF GPS.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Engine Active</span>
          <span aria-hidden="true">·</span>
          <span>FastAPI / React Architecture</span>
          <span aria-hidden="true">·</span>
          <span>Linux Mint / Debian Ready</span>
        </div>
      </div>

      {/* Mode Selector Tabs (Segmented control) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg max-w-2xl mb-5 border border-slate-800">
        <button
          type="button"
          onClick={() => { setSelectedType('USERNAME'); setInputValue('torvalds'); }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
            selectedType === 'USERNAME'
              ? 'bg-cyan-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Username OSINT</span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedType('PHONE'); setInputValue('+14155552671'); }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
            selectedType === 'PHONE'
              ? 'bg-cyan-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Phone OSINT</span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedType('EMAIL'); setInputValue('linus@kernel.org'); }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
            selectedType === 'EMAIL'
              ? 'bg-cyan-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email & Breaches</span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedType('DOMAIN'); setInputValue('github.com'); }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
            selectedType === 'DOMAIN'
              ? 'bg-cyan-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Domain & IP</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType('IMAGE_EXIF')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
            selectedType === 'IMAGE_EXIF'
              ? 'bg-cyan-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>EXIF Geolocation</span>
        </button>
      </div>

      {/* Target Input Form */}
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <AnimatePresence mode="wait">
          {selectedType !== 'IMAGE_EXIF' ? (
            <motion.div
              key="text-input-mode"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      selectedType === 'USERNAME'
                        ? 'Enter username or alias (e.g. torvalds, vitalik, sama)...'
                        : selectedType === 'PHONE'
                        ? 'Enter international phone number with country code (e.g. +14155552671, +79991234567)...'
                        : selectedType === 'EMAIL'
                        ? 'Enter email address for breach and service check (e.g. user@domain.com)...'
                        : 'Enter domain or IP (e.g. github.com, 1.1.1.1)...'
                    }
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Recon in Progress...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch Deep Scan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Quick presets for Username, Phone, Email & Domain */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
                <span className="text-slate-500">Fast Query Presets:</span>
                {presets[selectedType].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setInputValue(preset)}
                    className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 font-mono transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="image-exif-mode"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 flex items-center justify-center px-4 py-3 bg-slate-950 border border-dashed border-slate-700 hover:border-cyan-400 rounded-lg cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/tiff"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 text-xs text-slate-400 group-hover:text-slate-200">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>{selectedFile ? selectedFile.name : 'Select or drop JPG/PNG/TIFF image with GPS tags'}</span>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isLoading || !selectedFile}
                  className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                >
                  {isLoading ? (
                    <span>Extracting Metadata...</span>
                  ) : (
                    <>
                      <span>Extract EXIF GPS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Quick Sample Presets for GEOINT */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
                <span className="text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Test Presets:
                </span>
                <button
                  type="button"
                  onClick={() => loadSampleGeoint('Eiffel_Tower_Paris', 48.8584, 2.2945, 'Eiffel Tower, Champ de Mars, Paris, France')}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                >
                  Eiffel Tower, Paris (GPS)
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleGeoint('Tokyo_Skytree', 35.7100, 139.8107, 'Tokyo Skytree, Sumida, Tokyo, Japan')}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                >
                  Tokyo Skytree (GPS)
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleGeoint('Colosseum_Rome', 41.8902, 12.4922, 'Colosseum, Piazza del Colosseo, Rome, Italy')}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
                >
                  Colosseum, Rome (GPS)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};
