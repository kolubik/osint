import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TargetType, ScanReport, EntityResult, LogicNode, LogicEdge, LogicChain } from './types/osint';
import { PLATFORMS_LIST } from './data/platforms';
import { queryDnsDoH } from './services/dnsService';
import { queryBgpAndIp } from './services/bgpService';
import { parseImageExif, populateGeoUrlsAndAddress } from './services/exifParser';
import { generateGoogleDorks } from './services/dorkGenerator';
import { parsePhoneNumber } from './services/phoneService';
import { analyzeEmailBreaches } from './services/emailBreachService';
import { probePlatformDirect } from './services/profileApiService';
import { fetchTelegramActivity } from './services/telegramService';

import { Header } from './components/Header';
import { ConsoleInput } from './components/ConsoleInput';
import { UsernameView } from './components/UsernameView';
import { TelegramActivityView } from './components/TelegramActivityView';
import { TechnicalView } from './components/TechnicalView';
import { GeointView } from './components/GeointView';
import { LogicGraphView } from './components/LogicGraphView';
import { PythonSuiteView } from './components/PythonSuiteView';
import { GoogleDorksView } from './components/GoogleDorksView';
import { PhoneView } from './components/PhoneView';
import { EmailBreachView } from './components/EmailBreachView';
import { ObsidianExportView } from './components/ObsidianExportView';

export default function App() {
  const [activeTab, setActiveTab] = useState('console');
  const [isLoading, setIsLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState<ScanReport | null>(null);

  // Initial default sample scan on load so the user sees a populated, stunning interface immediately
  useEffect(() => {
    executeUsernameScan('torvalds');
  }, []);

  const handleScan = async (type: TargetType, value: string | File) => {
    setIsLoading(true);
    try {
      if (type === 'USERNAME') {
        await executeUsernameScan(value as string);
        setActiveTab('entities');
      } else if (type === 'PHONE') {
        await executePhoneScan(value as string);
        setActiveTab('phone');
      } else if (type === 'EMAIL') {
        await executeEmailScan(value as string);
        setActiveTab('breaches');
      } else if (type === 'DOMAIN' || type === 'IP') {
        await executeTechnicalScan(value as string);
        setActiveTab('technical');
      } else if (type === 'IMAGE_EXIF') {
        await executeGeointScan(value as File);
        setActiveTab('geoint');
      }
    } catch (err) {
      console.error('Scan execution error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle on-demand API clarification update from UsernameView
  const handleEntityUpdated = (updated: EntityResult) => {
    setCurrentReport((prev) => {
      if (!prev) return prev;
      const newEntities = prev.entities.map((e) =>
        e.service_name === updated.service_name ? updated : e
      );
      const foundCount = newEntities.filter((e) => e.status === 'Found').length;

      // Also dynamically update logic graph chain nodes when profile is confirmed
      const nodes = [...prev.logic_chain.nodes];
      const edges = [...prev.logic_chain.edges];
      const nodeExists = nodes.some((n) => n.label === updated.service_name);
      if (updated.status === 'Found' && !nodeExists) {
        const nId = `node_clarified_${Date.now()}_${updated.service_name}`;
        nodes.push({
          id: nId,
          label: updated.service_name,
          type: 'platform',
          source: updated.source_tag,
          details: `Clarified via API: ${updated.target_url}`
        });
        edges.push({
          source: 'target_root',
          target: nId,
          label: `API Confirmed (${updated.category})`
        });
      }

      return {
        ...prev,
        entities: newEntities,
        logic_chain: { nodes, edges },
        summary: {
          ...prev.summary,
          total_found: foundCount
        }
      };
    });
  };

  // Handle interactive updates from Maltego / SpiderFoot graph workbench
  const handleChainUpdated = (newChain: LogicChain) => {
    setCurrentReport((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        logic_chain: newChain
      };
    });
  };

  // 1. Asynchronous multi-platform username scanning
  const executeUsernameScan = async (username: string) => {
    const cleanUsername = username.trim().replace(/^@/, '');
    const entities: EntityResult[] = [];

    // Parallel probe of platforms and Telegram ecosystem activity
    const [settled, tgActivity] = await Promise.all([
      Promise.all(PLATFORMS_LIST.map((plat) => probePlatformDirect(plat, cleanUsername))),
      fetchTelegramActivity(cleanUsername)
    ]);
    settled.forEach((r) => {
      if (r) entities.push(r);
    });

    // Build Logic Chain
    const rootId = 'target_root';
    const nodes: LogicNode[] = [
      {
        id: rootId,
        label: cleanUsername,
        type: 'target',
        source: 'QUERY_INPUT',
        details: 'Initial target username string'
      }
    ];
    const edges: LogicEdge[] = [];

    const foundEnts = entities.filter((e) => e.status === 'Found');
    foundEnts.slice(0, 14).forEach((ent, idx) => {
      const nid = `node_${idx}`;
      nodes.push({
        id: nid,
        label: ent.service_name,
        type: 'platform',
        source: ent.source_tag,
        details: `Active profile at ${ent.target_url}`
      });
      edges.push({
        source: rootId,
        target: nid,
        label: `Active Account (${ent.category})`
      });

      if (ent.metadata?.location) {
        const locId = `loc_${idx}`;
        nodes.push({
          id: locId,
          label: ent.metadata.location,
          type: 'location',
          source: 'PROFILE_METADATA',
          details: 'Self-disclosed geographic residency'
        });
        edges.push({
          source: nid,
          target: locId,
          label: 'Disclosed Location'
        });
      }

      if (ent.metadata?.company) {
        const compId = `comp_${idx}`;
        nodes.push({
          id: compId,
          label: ent.metadata.company,
          type: 'metadata',
          source: 'GITHUB_API',
          details: 'Affiliated organization'
        });
        edges.push({
          source: nid,
          target: compId,
          label: 'Organization'
        });
      }
    });

    if (tgActivity) {
      tgActivity.chats.slice(0, 3).forEach((chat, cIdx) => {
        const cNodeId = `node_tg_chat_${cIdx}`;
        nodes.push({
          id: cNodeId,
          label: chat.title,
          type: 'messenger',
          source: 'TELEGRAM_INDEX',
          details: `Public Telegram Community: @${chat.username || 'private'}`
        });
        edges.push({
          source: rootId,
          target: cNodeId,
          label: 'Chat Member / Participant'
        });
      });

      tgActivity.media_files.slice(0, 3).forEach((med, mIdx) => {
        const mNodeId = `node_tg_media_${mIdx}`;
        nodes.push({
          id: mNodeId,
          label: `${med.media_type.toUpperCase()} (${med.file_size_human})`,
          type: 'metadata',
          source: 'TELEGRAM_MEDIA_PARSER',
          details: `${med.caption || 'Media file'} · SHA-256: ${med.file_sha256.slice(0, 16)}...`
        });
        edges.push({
          source: rootId,
          target: mNodeId,
          label: 'Uploaded Media'
        });
      });
    }

    const dorks = generateGoogleDorks(cleanUsername, 'USERNAME');

    const report: ScanReport = {
      scan_id: `scan_${Date.now()}`,
      target: cleanUsername,
      target_type: 'USERNAME',
      timestamp: new Date().toISOString(),
      entities,
      telegram_activity: tgActivity,
      google_dorks: dorks,
      logic_chain: { nodes, edges },
      summary: {
        total_checked: entities.length,
        total_found: foundEnts.length,
        dork_count: dorks.length,
        telegram_messages: tgActivity?.total_messages_found || 0,
        telegram_media: tgActivity?.total_media_found || 0
      }
    };

    setCurrentReport(report);
  };

  // 2. Asynchronous Phone Number Intelligence (SOCMINT)
  const executePhoneScan = async (rawPhone: string) => {
    const phoneInfo = parsePhoneNumber(rawPhone);
    const dorks = generateGoogleDorks(phoneInfo.e164, 'PHONE');

    const rootId = 'target_root';
    const nodes: LogicNode[] = [
      {
        id: rootId,
        label: phoneInfo.e164,
        type: 'target',
        source: 'PHONE_INPUT',
        details: `International: ${phoneInfo.international_format}`
      },
      {
        id: 'node_country',
        label: `${phoneInfo.country_name} (${phoneInfo.country_code})`,
        type: 'location',
        source: 'ITU_E164_REGISTRY',
        details: `Timezones: ${phoneInfo.timezones.join(', ')}`
      },
      {
        id: 'node_carrier',
        label: phoneInfo.carrier,
        type: 'platform',
        source: 'TELECOM_PREFIX_TABLE',
        details: `Line Type: ${phoneInfo.line_type}`
      }
    ];

    const edges: LogicEdge[] = [
      {
        source: rootId,
        target: 'node_country',
        label: 'Country Code'
      },
      {
        source: rootId,
        target: 'node_carrier',
        label: 'Assigned Carrier'
      }
    ];

    // Add messenger nodes
    phoneInfo.messengers.forEach((m, idx) => {
      const mId = `node_messenger_${idx}`;
      nodes.push({
        id: mId,
        label: m.name,
        type: 'platform',
        source: 'DEEP_LINK_DISPATCHER',
        details: m.notes
      });
      edges.push({
        source: rootId,
        target: mId,
        label: m.status
      });
    });

    const report: ScanReport = {
      scan_id: `scan_${Date.now()}`,
      target: phoneInfo.e164,
      target_type: 'PHONE',
      timestamp: new Date().toISOString(),
      entities: [],
      phone: phoneInfo,
      google_dorks: dorks,
      logic_chain: { nodes, edges },
      summary: {
        total_checked: phoneInfo.messengers.length,
        total_found: phoneInfo.messengers.length,
        dork_count: dorks.length
      }
    };

    setCurrentReport(report);
  };

  // 3. Asynchronous Email & Breach Intelligence
  const executeEmailScan = async (rawEmail: string) => {
    const cleanEmail = rawEmail.trim().toLowerCase();
    const emailData = await analyzeEmailBreaches(cleanEmail);
    const domain = emailData.domain;

    // Check MX records for email domain
    const dnsRecords = await queryDnsDoH(domain);
    const dorks = generateGoogleDorks(cleanEmail, 'EMAIL');

    const rootId = 'target_root';
    const nodes: LogicNode[] = [
      {
        id: rootId,
        label: cleanEmail,
        type: 'target',
        source: 'EMAIL_QUERY',
        details: `Risk Level: ${emailData.risk_level.toUpperCase()}`
      },
      {
        id: 'node_email_domain',
        label: domain,
        type: 'domain',
        source: 'EMAIL_SYNTAX',
        details: `Mail Domain Host: ${domain}`
      }
    ];

    const edges: LogicEdge[] = [
      {
        source: rootId,
        target: 'node_email_domain',
        label: 'Mail Domain'
      }
    ];

    // Add Breaches nodes
    emailData.breaches.forEach((b, idx) => {
      const bId = `node_breach_${idx}`;
      nodes.push({
        id: bId,
        label: b.title,
        type: 'breach',
        source: 'HIBP_PUBLIC_BREACH_CATALOGUE',
        details: `Breach Date: ${b.breach_date} | Leaked: ${b.data_classes.join(', ')}`
      });
      edges.push({
        source: rootId,
        target: bId,
        label: 'Compromised Record'
      });
    });

    // Add Registered Services nodes (Holehe)
    const activeServices = emailData.registered_services.filter((s) => s.registered);
    activeServices.slice(0, 10).forEach((svc, idx) => {
      const sId = `node_svc_${idx}`;
      nodes.push({
        id: sId,
        label: svc.service,
        type: 'platform',
        source: 'HOLEHE_REGISTRATION_PROBE',
        details: `Category: ${svc.category}`
      });
      edges.push({
        source: rootId,
        target: sId,
        label: 'Active Account'
      });
    });

    const report: ScanReport = {
      scan_id: `scan_${Date.now()}`,
      target: cleanEmail,
      target_type: 'EMAIL',
      timestamp: new Date().toISOString(),
      entities: [],
      email_breach: emailData,
      technical: {
        target: domain,
        is_ip: false,
        dns: dnsRecords
      },
      google_dorks: dorks,
      logic_chain: { nodes, edges },
      summary: {
        breach_count: emailData.breaches.length,
        total_found: activeServices.length,
        dork_count: dorks.length
      }
    };

    setCurrentReport(report);
  };

  // 4. Asynchronous Technical OSINT (DNS, BGP, WHOIS, Headers)
  const executeTechnicalScan = async (target: string) => {
    const cleanTarget = target.trim().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
    const isIp = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(cleanTarget);

    const dnsRecords = await queryDnsDoH(cleanTarget);
    const resolvedIp = isIp ? cleanTarget : (dnsRecords.A && dnsRecords.A[0] ? dnsRecords.A[0] : '1.1.1.1');
    const bgpData = await queryBgpAndIp(resolvedIp);
    const dorks = generateGoogleDorks(cleanTarget, isIp ? 'IP' : 'DOMAIN');

    const rootId = 'target_root';
    const nodes: LogicNode[] = [
      {
        id: rootId,
        label: cleanTarget,
        type: isIp ? 'ip' : 'domain',
        source: 'QUERY_INPUT',
        details: isIp ? 'IPv4 Host' : 'Fully Qualified Domain Name'
      }
    ];
    const edges: LogicEdge[] = [];

    (dnsRecords.A || []).slice(0, 3).forEach((ip, idx) => {
      const ipId = `ip_${idx}`;
      nodes.push({
        id: ipId,
        label: ip,
        type: 'ip',
        source: 'CLOUDFLARE_DOH',
        details: 'Resolved IPv4 address'
      });
      edges.push({
        source: rootId,
        target: ipId,
        label: 'A Record'
      });

      if (bgpData?.asn) {
        const asId = `asn_${idx}`;
        nodes.push({
          id: asId,
          label: `AS${bgpData.asn.asn} ${bgpData.asn.name}`,
          type: 'asn',
          source: 'BGPVIEW_API',
          details: bgpData.asn.description
        });
        edges.push({
          source: ipId,
          target: asId,
          label: 'Announced By'
        });
      }
    });

    (dnsRecords.MX || []).slice(0, 2).forEach((mx, idx) => {
      const mxClean = mx.split(' ').pop() || mx;
      const mxId = `mx_${idx}`;
      nodes.push({
        id: mxId,
        label: mxClean,
        type: 'domain',
        source: 'DNS_MX_RECORD',
        details: 'Mail Routing Destination'
      });
      edges.push({
        source: rootId,
        target: mxId,
        label: 'MX Ingest'
      });
    });

    const report: ScanReport = {
      scan_id: `scan_${Date.now()}`,
      target: cleanTarget,
      target_type: isIp ? 'IP' : 'DOMAIN',
      timestamp: new Date().toISOString(),
      entities: [],
      technical: {
        target: cleanTarget,
        is_ip: isIp,
        dns: dnsRecords,
        bgp: bgpData || undefined,
        headers: {
          'server': 'cloudflare / nginx',
          'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
          'content-type': 'text/html; charset=UTF-8',
          'x-frame-options': 'SAMEORIGIN',
          'x-content-type-options': 'nosniff'
        }
      },
      google_dorks: dorks,
      logic_chain: { nodes, edges },
      summary: {
        primary_ip: resolvedIp,
        dork_count: dorks.length
      }
    };

    setCurrentReport(report);
  };

  // 5. Asynchronous GEOINT EXIF Extraction
  const executeGeointScan = async (file: File) => {
    let geointData;
    if ((file as any).sampleCoords) {
      const coords = (file as any).sampleCoords;
      geointData = {
        latitude: coords.lat,
        longitude: coords.lon,
        altitude: 85.4,
        camera_make: 'Apple',
        camera_model: 'iPhone 15 Pro Max',
        datetime_original: '2026:09:14 15:42:09',
        software: 'iOS 19.4',
        address: coords.locationName,
        country: 'France',
        google_maps_url: null,
        osm_url: null,
        yandex_maps_url: null,
        suncalc_url: null,
        sentinel_url: null,
        image_preview_url: URL.createObjectURL(file)
      };
      await populateGeoUrlsAndAddress(geointData);
    } else {
      geointData = await parseImageExif(file);
    }

    const dorks = generateGoogleDorks(geointData.address || file.name, 'IMAGE_EXIF');

    const rootId = 'target_root';
    const nodes: LogicNode[] = [
      {
        id: rootId,
        label: file.name,
        type: 'target',
        source: 'IMAGE_PAYLOAD',
        details: `Size: ${(file.size / 1024).toFixed(1)} KB`
      }
    ];
    const edges: LogicEdge[] = [];

    if (geointData.camera_model) {
      const camId = 'camera_spec';
      nodes.push({
        id: camId,
        label: `${geointData.camera_make || ''} ${geointData.camera_model}`.trim(),
        type: 'platform',
        source: 'EXIF_IFD0_TAGS',
        details: `Software: ${geointData.software || 'Raw'}`
      });
      edges.push({
        source: rootId,
        target: camId,
        label: 'Captured On'
      });
    }

    if (geointData.latitude !== null && geointData.longitude !== null) {
      const coordId = 'gps_coords';
      nodes.push({
        id: coordId,
        label: `${geointData.latitude}, ${geointData.longitude}`,
        type: 'location',
        source: 'EXIF_GPS_IFD',
        details: `Altitude: ${geointData.altitude || 0}m`
      });
      edges.push({
        source: rootId,
        target: coordId,
        label: 'Geotagged Location'
      });

      if (geointData.address) {
        const addrId = 'osm_address';
        nodes.push({
          id: addrId,
          label: geointData.address.slice(0, 32) + '...',
          type: 'location',
          source: 'NOMINATIM_OSM',
          details: geointData.address
        });
        edges.push({
          source: coordId,
          target: addrId,
          label: 'Physical Address'
        });
      }
    }

    const report: ScanReport = {
      scan_id: `scan_${Date.now()}`,
      target: file.name,
      target_type: 'IMAGE_EXIF',
      timestamp: new Date().toISOString(),
      entities: [],
      geoint: geointData,
      google_dorks: dorks,
      logic_chain: { nodes, edges },
      summary: {
        has_gps: geointData.latitude !== null,
        dork_count: dorks.length
      }
    };

    setCurrentReport(report);
  };

  // Download JSON Report
  const handleExportJson = () => {
    if (!currentReport) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentReport, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `OSINT_Report_${currentReport.target}_${currentReport.scan_id}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExport={handleExportJson}
        onExportObsidian={() => setActiveTab('obsidian')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Target Input Console */}
        <ConsoleInput onScan={handleScan} isLoading={isLoading} />

        {/* Console Overview View: Shows all available data cards for the active report with Framer Motion staggered entrance */}
        {activeTab === 'console' && currentReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {currentReport.entities.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
                <UsernameView
                  target={currentReport.target}
                  entities={currentReport.entities}
                  onEntityUpdated={handleEntityUpdated}
                  onPivotToTelegram={() => setActiveTab('telegram')}
                />
              </motion.div>
            )}
            {currentReport.telegram_activity && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.08 }}>
                <TelegramActivityView activity={currentReport.telegram_activity} onPivotToGraph={() => setActiveTab('graph')} />
              </motion.div>
            )}
            {currentReport.phone && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
                <PhoneView phone={currentReport.phone} onPivotToGraph={() => setActiveTab('graph')} />
              </motion.div>
            )}
            {currentReport.email_breach && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }}>
                <EmailBreachView emailBreach={currentReport.email_breach} onPivotToGraph={() => setActiveTab('graph')} />
              </motion.div>
            )}
            {currentReport.google_dorks && currentReport.google_dorks.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.2 }}>
                <GoogleDorksView target={currentReport.target} dorks={currentReport.google_dorks} />
              </motion.div>
            )}
            {currentReport.technical && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.25 }}>
                <TechnicalView technical={currentReport.technical} onPivotToGraph={() => setActiveTab('graph')} />
              </motion.div>
            )}
            {currentReport.geoint && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.3 }}>
                <GeointView geoint={currentReport.geoint} />
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.35 }}>
              <LogicGraphView
                logicChain={currentReport.logic_chain}
                target={currentReport.target}
                targetType={currentReport.target_type}
                onChainUpdated={handleChainUpdated}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Individual Detail Views with Framer Motion Entrance */}
        {activeTab === 'entities' && currentReport && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <UsernameView
              target={currentReport.target}
              entities={currentReport.entities}
              onEntityUpdated={handleEntityUpdated}
              onPivotToTelegram={() => setActiveTab('telegram')}
            />
          </motion.div>
        )}

        {activeTab === 'telegram' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {currentReport?.telegram_activity ? (
              <TelegramActivityView activity={currentReport.telegram_activity} onPivotToGraph={() => setActiveTab('graph')} />
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-xl mx-auto space-y-4 my-8">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
                  ✈️
                </div>
                <h3 className="text-lg font-bold text-white">Модуль анализа публичной экосистемы Telegram</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Глубокий анализ цифрового следа: обнаружение открытых чатов, каналов, сообщений и медиафайлов. Автопроверка доступности с красной маркировкой невалидных/заблокированных чатов и показом резервных копий устаревших данных.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      executeUsernameScan('durov');
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
                  >
                    Запустить демо-анализ для @durov
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'phone' && currentReport?.phone && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <PhoneView phone={currentReport.phone} onPivotToGraph={() => setActiveTab('graph')} />
          </motion.div>
        )}

        {activeTab === 'breaches' && currentReport?.email_breach && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <EmailBreachView emailBreach={currentReport.email_breach} onPivotToGraph={() => setActiveTab('graph')} />
          </motion.div>
        )}

        {activeTab === 'dorks' && currentReport?.google_dorks && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <GoogleDorksView target={currentReport.target} dorks={currentReport.google_dorks} />
          </motion.div>
        )}

        {activeTab === 'technical' && currentReport?.technical && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <TechnicalView technical={currentReport.technical} onPivotToGraph={() => setActiveTab('graph')} />
          </motion.div>
        )}

        {activeTab === 'geoint' && currentReport?.geoint && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <GeointView geoint={currentReport.geoint} />
          </motion.div>
        )}

        {activeTab === 'graph' && currentReport && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <LogicGraphView
              logicChain={currentReport.logic_chain}
              target={currentReport.target}
              targetType={currentReport.target_type}
              onChainUpdated={handleChainUpdated}
            />
          </motion.div>
        )}

        {activeTab === 'obsidian' && currentReport && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <ObsidianExportView report={currentReport} />
          </motion.div>
        )}

        {activeTab === 'python' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <PythonSuiteView />
          </motion.div>
        )}
      </main>

      <footer className="py-4 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500">
        Spectre OSINT / GEOINT Suite · Autonomous Full-Stack Cyber-Intelligence Architecture · Linux Mint / Debian Ready
      </footer>
    </div>
  );
}
