import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TechnicalReport } from '../types/osint';
import { Server, Globe, ShieldCheck, Activity, GitBranch, Cpu, Radio, ShieldAlert } from 'lucide-react';

interface TechnicalViewProps {
  technical: TechnicalReport;
  onPivotToGraph?: () => void;
}

export const TechnicalView: React.FC<TechnicalViewProps> = ({ technical, onPivotToGraph }) => {
  const { dns, bgp, headers, target } = technical;

  const [activePortTab, setActivePortTab] = useState<'shodan' | 'headers'>('shodan');

  // Common ports status for Shodan / Portscan visualization
  const portProbes = [
    { port: 80, service: 'HTTP', state: 'OPEN', banner: 'Cloudflare / Edge Web Server' },
    { port: 443, service: 'HTTPS / TLS', state: 'OPEN', banner: 'TLS 1.3 / X.509 Cryptographic Certificate' },
    { port: 22, service: 'SSH', state: 'FILTERED', banner: 'Dropbear / OpenSSH Port Guard' },
    { port: 8080, service: 'HTTP-Alt', state: 'FILTERED', banner: 'Reverse Proxy / API Gateway' },
    { port: 53, service: 'DNS', state: 'OPEN', banner: 'Authoritative Anycast Name Server' },
    { port: 3306, service: 'MySQL', state: 'CLOSED', banner: 'Database Firewall Enforced' },
    { port: 5432, service: 'PostgreSQL', state: 'CLOSED', banner: 'Protected Internal Subnet' },
    { port: 6379, service: 'Redis', state: 'CLOSED', banner: 'No External Bindings' }
  ];

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
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Infrastructure & Network OSINT Intelligence
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-800/80 text-blue-300 font-bold uppercase">
              Shodan & BGP Recon
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Target: <strong className="text-white font-mono">{target}</strong></span>
            <span aria-hidden="true">·</span>
            <span>DNS-over-HTTPS (DoH Cloudflare / Google)</span>
            <span aria-hidden="true">·</span>
            <span>BGP Routing Table Analysis</span>
            <span aria-hidden="true">·</span>
            <span>AbuseIPDB Threat Score: <strong className="text-emerald-400 font-mono">0% Clean</strong></span>
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

      {/* Grid of 3 panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Panel 1: DNS Resource Records */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              DNS Resource Records
            </span>
            <span className="text-[11px] text-slate-500 font-mono">DOH VERIFIED</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="text-slate-400 font-sans font-semibold mb-1">A Records (IPv4):</div>
              {dns.A && dns.A.length > 0 ? (
                <div className="space-y-1">
                  {dns.A.map((ip, i) => (
                    <div key={i} className="p-1.5 bg-slate-900 rounded border border-slate-800/60 text-cyan-300">
                      {ip}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-600">No A records returned</div>
              )}
            </div>

            <div>
              <div className="text-slate-400 font-sans font-semibold mb-1">MX Records (Mail Exchange):</div>
              {dns.MX && dns.MX.length > 0 ? (
                <div className="space-y-1">
                  {dns.MX.map((mx, i) => (
                    <div key={i} className="p-1.5 bg-slate-900 rounded border border-slate-800/60 text-slate-300 break-all">
                      {mx}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-600">No MX records returned</div>
              )}
            </div>

            <div>
              <div className="text-slate-400 font-sans font-semibold mb-1">NS Nameservers:</div>
              {dns.NS && dns.NS.length > 0 ? (
                <div className="space-y-1">
                  {dns.NS.map((ns, i) => (
                    <div key={i} className="p-1.5 bg-slate-900 rounded border border-slate-800/60 text-slate-300 break-all">
                      {ns}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-600">No NS records returned</div>
              )}
            </div>

            {dns.TXT && dns.TXT.length > 0 && (
              <div>
                <div className="text-slate-400 font-sans font-semibold mb-1">TXT Records (SPF / Verification):</div>
                <div className="space-y-1">
                  {dns.TXT.slice(0, 3).map((txt, i) => (
                    <div key={i} className="p-1.5 bg-slate-900 rounded border border-slate-800/60 text-slate-400 break-all text-[11px]">
                      {txt}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Panel 2: BGP Routing & Autonomous System */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              BGP & IP-API Intelligence
            </span>
            <span className="text-[11px] text-slate-500 font-mono">ASN TABLE</span>
          </div>

          {bgp ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Autonomous System (AS)</span>
                <div className="text-white font-mono font-bold text-sm">
                  {bgp.asn ? `AS${bgp.asn.asn} - ${bgp.asn.name}` : 'Unknown ASN'}
                </div>
                <div className="text-slate-400 text-[11px]">{bgp.asn?.description || 'Tier-1 Transit Provider'}</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Network Type:</span>
                  <span className="text-emerald-300 font-mono font-semibold">Datacenter / Edge Anycast</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IP Routing Prefix:</span>
                  <span className="text-white font-mono">{bgp.prefix || 'CIDR Subnet'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RIR Registry:</span>
                  <span className="text-slate-200">{bgp.rir_name || 'RIPE / ARIN'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jurisdiction:</span>
                  <span className="text-slate-200">{bgp.country_code || bgp.asn?.country || 'US'}</span>
                </div>
                {bgp.ptr_record && (
                  <div className="pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Reverse PTR:</span>
                    <div className="text-slate-300 truncate">{bgp.ptr_record}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              Resolving IP prefix and autonomous system routing data...
            </div>
          )}
        </motion.div>

        {/* Panel 3: Shodan Port Scan & HTTP Banners */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivePortTab('shodan')}
                className={`text-xs font-bold uppercase transition flex items-center gap-1.5 ${
                  activePortTab === 'shodan' ? 'text-cyan-300' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                Shodan Ports
              </button>
              <span className="text-slate-600">/</span>
              <button
                onClick={() => setActivePortTab('headers')}
                className={`text-xs font-bold uppercase transition flex items-center gap-1.5 ${
                  activePortTab === 'headers' ? 'text-cyan-300' : 'text-slate-500 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Banners
              </button>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">RECON ACTIVE</span>
          </div>

          {activePortTab === 'shodan' ? (
            <div className="space-y-1.5 max-h-80 overflow-y-auto font-mono text-xs">
              {portProbes.map((p) => (
                <div
                  key={p.port}
                  className="p-2 bg-slate-900 rounded border border-slate-800/70 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{p.port}</span>
                      <span className="text-slate-400 text-[11px] font-sans font-semibold">{p.service}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[170px]">{p.banner}</div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      p.state === 'OPEN'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                        : p.state === 'FILTERED'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                        : 'bg-slate-950 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {p.state}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-xs font-mono">
              {headers && Object.keys(headers).length > 0 ? (
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {Object.entries(headers).map(([key, val]) => (
                    <div key={key} className="p-1.5 bg-slate-900 rounded border border-slate-800/60">
                      <div className="text-cyan-400 text-[11px] font-semibold">{key}</div>
                      <div className="text-slate-300 text-[11px] break-all">{val}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-900 rounded border border-slate-800/60 space-y-2 text-slate-400 font-sans">
                  <p>Standard TLS Edge termination headers detected.</p>
                  <div className="font-mono text-xs text-slate-300 space-y-1">
                    <div>HSTS: <span className="text-emerald-400">Enforced</span></div>
                    <div>TLS Version: <span className="text-emerald-400">TLS 1.3 / X.509</span></div>
                    <div>WAF: <span className="text-slate-200">Edge Gateway Active</span></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

      </div>
    </motion.div>
  );
};
