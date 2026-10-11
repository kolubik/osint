import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Copy, Check, Download, Layers, ShieldCheck, Play } from 'lucide-react';

export const PythonSuiteView: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<'app.py' | 'Dockerfile' | 'docker-compose.yml' | 'requirements.txt' | 'ci.yml'>('app.py');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filesContent = {
    'app.py': `# View or download the complete standalone autonomous backend:
# Created directly at /app.py in this repository root.
# Contains:
# - Full FastAPI + Uvicorn server
# - 50+ Platform Async Workers (GitHub, Reddit, Steam, Telegram, etc.)
# - dnspython & python-whois Technical OSINT
# - Pillow EXIF GPS Extractor with Nominatim Reverse Geocoding
# - Integrated Vis.js / Tailwind HTML Dashboard
# - Pydantic v2 Models & JSON Export Endpoints
# Run with: python3 app.py`,
    'Dockerfile': `FROM python:3.10-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y gcc git libmagic1 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.10-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y libmagic1 curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /root/.local /root/.local
COPY app.py .
ENV PATH=/root/.local/bin:$PATH
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:8000/health || exit 1
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]`,
    'docker-compose.yml': `version: '3.8'
services:
  spectre-osint:
    build: .
    container_name: spectre_osint_engine
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3`,
    'requirements.txt': `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
httpx>=0.27.0
dnspython>=2.6.1
python-whois>=0.9.4
Pillow>=10.2.0
pydantic>=2.6.4
jinja2>=3.1.3
python-multipart>=0.0.9
loguru>=0.7.2
phonenumbers>=8.13.30
pytest>=8.0.2
pytest-asyncio>=0.23.5`,
    'ci.yml': `name: Spectre OSINT CI/CD Pipeline
on: [push, pull_request]
jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.10"
      - run: pip install -r requirements.txt pytest flake8
      - run: flake8 app.py --count --max-line-length=127
      - run: python -c "import app; print('App successfully verified')"
  docker-build:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: false`
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6"
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            Standalone Linux Mint / Debian Deployment Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete instructions, pip commands, and production Docker containerization for Linux environments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadFile(activeFile, filesContent[activeFile])}
            className="px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {activeFile}</span>
          </button>
        </div>
      </div>

      {/* Terminal Command Quickstart */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            Linux Mint / Debian Quickstart Terminal Commands
          </span>
          <button
            onClick={() => copyToClipboard(`sudo apt update && sudo apt install -y python3 python3-pip python3-venv git libmagic1\npython3 -m venv venv && source venv/bin/activate\npip install fastapi uvicorn[standard] httpx dnspython python-whois Pillow pydantic jinja2 python-multipart loguru\npython3 app.py`, 'terminal_quickstart')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            {copiedKey === 'terminal_quickstart' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy All</span>
          </button>
        </div>

        <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`# 1. Install Linux Mint / Debian prerequisites:
sudo apt update && sudo apt install -y python3 python3-pip python3-venv git libmagic1

# 2. Setup Virtual Environment:
python3 -m venv venv && source venv/bin/activate

# 3. Install Python Dependencies:
pip install fastapi "uvicorn[standard]" httpx dnspython python-whois Pillow pydantic jinja2 python-multipart loguru

# 4. Launch Autonomous Server:
python3 app.py
# -> Running on http://localhost:8000`}
        </pre>
      </div>

      {/* File Viewer Selector */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 max-w-2xl">
          {(['app.py', 'Dockerfile', 'docker-compose.yml', 'requirements.txt', 'ci.yml'] as const).map((file) => (
            <button
              key={file}
              onClick={() => setActiveFile(file)}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
                activeFile === file
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {file}
            </button>
          ))}
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
            <span className="text-xs font-mono text-slate-400">{activeFile}</span>
            <button
              onClick={() => copyToClipboard(filesContent[activeFile], activeFile)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {copiedKey === activeFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy File Content</span>
            </button>
          </div>

          <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 max-h-96 overflow-y-auto whitespace-pre-wrap">
            {filesContent[activeFile]}
          </pre>
        </div>
      </div>

      {/* Production & Scalability Best Practices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Asynchronous Scalability
          </div>
          <p className="text-xs text-slate-400">
            Powered by Python asyncio and httpx bounded connection pools (semaphore limit = 15) to prevent socket starvation and IP bans.
          </p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Defensive Security & Privacy
          </div>
          <p className="text-xs text-slate-400">
            Zero third-party tracking, rotatable User-Agent headers, automated false-positive sanitization, and isolated EXIF byte parsers.
          </p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            Structured Loguru Logging
          </div>
          <p className="text-xs text-slate-400">
            Automated rotating logs saved at <code>logs/spectre_osint.log</code> with 10MB limits, zip compression, and audit retention.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
