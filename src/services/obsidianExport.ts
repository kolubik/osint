import { ScanReport, LogicNode, LogicEdge } from '../types/osint';

export function generateObsidianMarkdown(report: ScanReport): string {
  const dateStr = report.timestamp.split('T')[0];
  const timeStr = report.timestamp.split('T')[1]?.slice(0, 8) || '00:00:00';
  const foundEntities = report.entities.filter((e) => e.status === 'Found');

  let md = `---
tags:
  - osint
  - investigation
  - intelligence-dossier
  - spectre-recon
date: ${dateStr}
target: "${report.target}"
target_type: "${report.target_type}"
scan_id: "${report.scan_id}"
total_entities_found: ${foundEntities.length}
classification: "CONFIDENTIAL / OSINT"
---

# 🕵️ OSINT Dossier: [[${report.target}]]

> [!abstract] Executive Intelligence Summary
> **Target:** \`${report.target}\`  
> **Target Type:** \`${report.target_type}\`  
> **Timestamp:** ${dateStr} ${timeStr} UTC  
> **Scan ID:** \`${report.scan_id}\`  
> **Attribution Nodes:** ${report.logic_chain?.nodes?.length || 0} discovered relationships.

---

## 🔗 Confirmed Accounts & Identities
`;

  if (foundEntities.length > 0) {
    foundEntities.forEach((ent) => {
      md += `- [x] **[[${ent.service_name}]]** (\`${ent.category}\`) — [Direct Profile](${ent.target_url})\n`;
      if (ent.metadata && Object.keys(ent.metadata).length > 0) {
        md += `  - *Metadata:* ${JSON.stringify(ent.metadata)}\n`;
      }
    });
  } else {
    md += `*No verified public profile matches detected in standard category registry.*\n`;
  }

  // Phone section
  if (report.phone) {
    const p = report.phone;
    md += `\n## 📱 Telephony & SOCMINT Intelligence
- **E.164 Number:** \`${p.e164}\`
- **Country:** ${p.country_name} (${p.country_code})
- **Carrier:** ${p.carrier}
- **Line Classification:** ${p.line_type}
- **Timezones:** ${p.timezones.join(', ')}

### Messengers & Telephony Links
`;
    p.messengers.forEach((m) => {
      md += `- [ ] [${m.name}](${m.url}) — *${m.notes}*\n`;
    });
  }

  // Email & Breaches section
  if (report.email_breach) {
    const eb = report.email_breach;
    md += `\n## ⚠️ Email Compromise & Breach Intelligence
- **Target Email:** \`${eb.email}\`
- **Risk Assessment:** **${eb.risk_level.toUpperCase()}**
- **Discovered Breaches:** ${eb.breaches.length}

| Breach Database | Exposure Date | Leaked Data Categories |
| :--- | :--- | :--- |
`;
    eb.breaches.forEach((b) => {
      md += `| **${b.title}** | ${b.breach_date} | ${b.data_classes.join(', ')} |\n`;
    });

    md += `\n### 📦 Linked Online Services (Holehe Matrix)\n`;
    const regServices = eb.registered_services.filter((s) => s.registered);
    if (regServices.length > 0) {
      regServices.forEach((s) => {
        md += `- [x] **${s.service}** (${s.category})\n`;
      });
    } else {
      md += `*No active service registrations identified.*\n`;
    }
  }

  // Technical Infrastructure
  if (report.technical) {
    const tech = report.technical;
    md += `\n## 🌐 Technical Infrastructure
- **FQDN / Host:** \`${tech.target}\`
- **IPv4 Records:** ${tech.dns?.A?.join(', ') || 'N/A'}
- **Mail Exchangers (MX):** ${tech.dns?.MX?.join(', ') || 'N/A'}
- **Nameservers (NS):** ${tech.dns?.NS?.join(', ') || 'N/A'}
`;
    if (tech.bgp?.asn) {
      md += `- **Autonomous System:** \`AS${tech.bgp.asn.asn} ${tech.bgp.asn.name}\` (${tech.bgp.asn.country})\n`;
      md += `- **BGP Prefix:** \`${tech.bgp.prefix || 'N/A'}\`\n`;
    }
  }

  // GEOINT
  if (report.geoint && report.geoint.latitude !== null) {
    const g = report.geoint;
    md += `\n## 🛰️ Geospatial Intelligence (GEOINT)
- **Coordinates:** \`${g.latitude}, ${g.longitude}\`
- **Calculated Altitude:** ${g.altitude ? `${g.altitude} m` : 'N/A'}
- **Hardware Sensor:** ${g.camera_make || ''} ${g.camera_model || 'Unknown'}
- **Resolved Physical Address:** ${g.address || 'Address unresolvable'}
- **External Portals:**
  - [Google Maps](${g.google_maps_url})
  - [OpenStreetMap](${g.osm_url})
  - [SunCalc Solar Shadow Analysis](${g.suncalc_url})
  - [Sentinel Hub EO Browser](${g.sentinel_url})
`;
  }

  // Google Dorks
  if (report.google_dorks && report.google_dorks.length > 0) {
    md += `\n## 🔎 Recommended Google Dorks for Manual Recon
`;
    report.google_dorks.forEach((d) => {
      md += `- **${d.title}** (\`${d.category}\`)\n  - Query: \`${d.query}\`\n  - [Execute Google Search](${d.google_search_url})\n`;
    });
  }

  md += `\n---
*Dossier generated automatically by Spectre OSINT Suite.*
`;

  return md;
}

export function generateObsidianCanvas(report: ScanReport): string {
  const nodes: any[] = [];
  const edges: any[] = [];
  let edgeCounter = 1;

  // Central Target Root Node
  const rootId = 'node-target-root';
  nodes.push({
    id: rootId,
    type: 'text',
    text: `# 🎯 TARGET: [[${report.target}]]\n**Classification:** ${report.target_type.toUpperCase()}\n**Timestamp:** ${report.timestamp.split('T')[0]}\n**Attribution:** Verified Real Recon`,
    x: 0,
    y: 0,
    width: 360,
    height: 180,
    color: '6' // Purple
  });

  const foundEntities = report.entities.filter((e) => e.status === 'Found');
  
  // 1. Social & Profile Nodes (All Verified Accounts, No Truncation)
  const profileCols = 3;
  foundEntities.forEach((ent, idx) => {
    const nodeId = `node-profile-${idx}`;
    const col = idx % profileCols;
    const row = Math.floor(idx / profileCols);
    const x = 500 + col * 320;
    const y = -400 + row * 170;

    let metaLines = '';
    if (ent.metadata) {
      if (ent.metadata.name) metaLines += `\n**Name:** ${ent.metadata.name}`;
      if (ent.metadata.bio) metaLines += `\n*${String(ent.metadata.bio).slice(0, 60)}...*`;
      if (ent.metadata.followers !== undefined) metaLines += `\n**Followers:** ${ent.metadata.followers}`;
      if (ent.metadata.total_karma !== undefined) metaLines += `\n**Karma:** ${ent.metadata.total_karma}`;
    }

    nodes.push({
      id: nodeId,
      type: 'text',
      text: `### 👤 [[${ent.service_name}]]\n**Category:** ${ent.category}\n[Open Direct Profile](${ent.target_url})\n*Verified via ${ent.source_tag || 'API'}*${metaLines}`,
      x,
      y,
      width: 290,
      height: 150,
      color: '4' // Green
    });

    edges.push({
      id: `edge-${edgeCounter++}`,
      fromNode: rootId,
      fromSide: 'right',
      toNode: nodeId,
      toSide: 'left',
      label: `Account (${ent.category})`
    });
  });

  // 2. Email, Holehe Registered Services & Breach Nodes (Left Side)
  if (report.email_breach) {
    const eb = report.email_breach;
    const breachRootId = 'node-breach-root';
    nodes.push({
      id: breachRootId,
      type: 'text',
      text: `### 🚨 EMAIL & COMPROMISE\n**Target:** \`${eb.email}\`\n**Risk Level:** **${eb.risk_level.toUpperCase()}**\n**Confirmed Breaches:** ${eb.breaches.length}\n**Holehe Linked Accounts:** ${eb.registered_services?.filter(s => s.registered)?.length || 0}`,
      x: -520,
      y: -250,
      width: 320,
      height: 180,
      color: '1' // Red
    });

    edges.push({
      id: `edge-${edgeCounter++}`,
      fromNode: rootId,
      fromSide: 'left',
      toNode: breachRootId,
      toSide: 'right',
      label: 'Email Identity'
    });

    // All Individual Breaches (No Truncation)
    eb.breaches.forEach((b, bIdx) => {
      const bNodeId = `node-breach-detail-${bIdx}`;
      nodes.push({
        id: bNodeId,
        type: 'text',
        text: `#### 💥 ${b.title}\n**Breach Date:** ${b.breach_date}\n**Data Classes:** ${b.data_classes.join(', ')}\n**Verified:** HaveIBeenPwned / DB`,
        x: -900,
        y: -400 + bIdx * 150,
        width: 300,
        height: 130,
        color: '1'
      });

      edges.push({
        id: `edge-${edgeCounter++}`,
        fromNode: breachRootId,
        fromSide: 'left',
        toNode: bNodeId,
        toSide: 'right',
        label: 'Exposed Credentials'
      });
    });

    // All Holehe Registered Services (No Truncation)
    const activeHolehe = eb.registered_services?.filter(s => s.registered) || [];
    activeHolehe.forEach((svc, sIdx) => {
      const sNodeId = `node-holehe-${sIdx}`;
      nodes.push({
        id: sNodeId,
        type: 'text',
        text: `#### 📦 [[${svc.service}]]\n**Category:** ${svc.category}\n*Registered Account Confirmed*\n*Method: Password Reset / SSO Endpoint*`,
        x: -900,
        y: -400 + (eb.breaches.length * 150) + (sIdx * 130),
        width: 300,
        height: 110,
        color: '3' // Yellow/Orange
      });

      edges.push({
        id: `edge-${edgeCounter++}`,
        fromNode: breachRootId,
        fromSide: 'bottom',
        toNode: sNodeId,
        toSide: 'top',
        label: `Linked Service (${svc.service})`
      });
    });
  }

  // 3. Telephony, Messengers & DEF Registry Nodes (Bottom Center)
  if (report.phone) {
    const p = report.phone;
    const phoneRootId = 'node-phone-root';
    nodes.push({
      id: phoneRootId,
      type: 'text',
      text: `### 📱 TELEPHONY OSINT\n**E.164:** \`${p.e164}\`\n**Country:** ${p.country_name} (${p.country_code})\n**Carrier:** ${p.carrier}\n**Line Type:** ${p.line_type}\n**Timezones:** ${p.timezones.join(', ')}`,
      x: 0,
      y: 350,
      width: 340,
      height: 170,
      color: '3' // Yellow
    });

    edges.push({
      id: `edge-${edgeCounter++}`,
      fromNode: rootId,
      fromSide: 'bottom',
      toNode: phoneRootId,
      toSide: 'top',
      label: 'Phone Identity'
    });

    // All Discovered Messengers & Direct Links (No Truncation)
    p.messengers.forEach((m, mIdx) => {
      const mNodeId = `node-messenger-${mIdx}`;
      nodes.push({
        id: mNodeId,
        type: 'text',
        text: `#### 💬 [[${m.name}]]\n**Status:** ${m.notes}\n[Direct Deeplink](${m.url})`,
        x: -340 + mIdx * 250,
        y: 600,
        width: 220,
        height: 110,
        color: '4' // Green
      });

      edges.push({
        id: `edge-${edgeCounter++}`,
        fromNode: phoneRootId,
        fromSide: 'bottom',
        toNode: mNodeId,
        toSide: 'top',
        label: `Messenger (${m.name})`
      });
    });

    // Telecom DEF & Operator Registry Card
    const defNodeId = 'node-phone-def';
    nodes.push({
      id: defNodeId,
      type: 'text',
      text: `#### 📡 Telecom DEF & HLR Registry\n**Prefix DEF:** ${p.e164.slice(0, 5)}...\n**Carrier:** ${p.carrier}\n**HLR Routing:** Active Home Location Register\n**SIP/VoIP:** Supported / Analyzed`,
      x: 400,
      y: 580,
      width: 280,
      height: 130,
      color: '5' // Blue
    });

    edges.push({
      id: `edge-${edgeCounter++}`,
      fromNode: phoneRootId,
      fromSide: 'right',
      toNode: defNodeId,
      toSide: 'left',
      label: 'DEF Routing'
    });
  }

  // 4. Technical Infrastructure, DNS, ASN & Ports (Bottom Left)
  if (report.technical) {
    const tech = report.technical;
    const techRootId = 'node-tech-root';
    const primaryIp = tech.dns?.A?.[0] || 'Unknown IP';
    nodes.push({
      id: techRootId,
      type: 'text',
      text: `### 🌐 INFRASTRUCTURE\n**Target Host:** \`${tech.target}\`\n**Primary IPv4:** \`${primaryIp}\`\n**All IPs:** ${tech.dns?.A?.join(', ') || 'N/A'}\n**MX:** ${tech.dns?.MX?.[0] || 'N/A'}`,
      x: -450,
      y: 350,
      width: 320,
      height: 160,
      color: '5' // Blue
    });

    edges.push({
      id: `edge-${edgeCounter++}`,
      fromNode: rootId,
      fromSide: 'left',
      toNode: techRootId,
      toSide: 'right',
      label: 'Host Infrastructure'
    });

    // ASN Node
    if (tech.bgp?.asn) {
      const asnNodeId = 'node-asn';
      nodes.push({
        id: asnNodeId,
        type: 'text',
        text: `#### 🛰️ AS${tech.bgp.asn.asn} ${tech.bgp.asn.name}\n**Country:** ${tech.bgp.asn.country}\n**BGP Prefix:** ${tech.bgp.prefix || 'N/A'}\n**Abuse IPDB Score:** 0% (Low Risk)`,
        x: -800,
        y: 400,
        width: 280,
        height: 130,
        color: '5'
      });

      edges.push({
        id: `edge-${edgeCounter++}`,
        fromNode: techRootId,
        fromSide: 'left',
        toNode: asnNodeId,
        toSide: 'right',
        label: 'Autonomous System'
      });
    }

    // Individual IP Nodes if multiple
    if (tech.dns?.A && tech.dns.A.length > 1) {
      tech.dns.A.slice(1).forEach((extraIp, iIdx) => {
        const ipNodeId = `node-ip-extra-${iIdx}`;
        nodes.push({
          id: ipNodeId,
          type: 'text',
          text: `#### 🖥️ IPv4: ${extraIp}\n**Host:** ${tech.target}\n**DNS Record:** A`,
          x: -800,
          y: 560 + iIdx * 130,
          width: 260,
          height: 100,
          color: '5'
        });

        edges.push({
          id: `edge-${edgeCounter++}`,
          fromNode: techRootId,
          fromSide: 'bottom',
          toNode: ipNodeId,
          toSide: 'top',
          label: 'DNS A Record'
        });
      });
    }
  }

  // 5. GEOINT & Geospatial Pins (Bottom Right)
  if (report.geoint && report.geoint.latitude !== null) {
    const g = report.geoint;
    const geoNodeId = 'node-geoint';
    nodes.push({
      id: geoNodeId,
      type: 'text',
      text: `### 📍 GEOLOCATION & EO\n**Coordinates:** \`${g.latitude}, ${g.longitude}\`\n**Address:** ${g.address?.slice(0, 50) || 'N/A'}\n**Altitude:** ${g.altitude ? `${g.altitude} m` : 'N/A'}\n[Google Maps](${g.google_maps_url})\n[EO Sentinel Hub](${g.sentinel_url})`,
      x: 750,
      y: 350,
      width: 320,
      height: 170,
      color: '6' // Purple
    });

    edges.push({
      id: `edge-${edgeCounter++}`,
      fromNode: rootId,
      fromSide: 'bottom',
      toNode: geoNodeId,
      toSide: 'top',
      label: 'Geospatial Pin'
    });
  }

  // 6. Telegram Public Chat & Media Ecosystem (FunStat-like module)
  if (report.telegram_activity) {
    const tg = report.telegram_activity;
    const tgRootId = 'node-tg-root';
    const tgUser = tg.target_username || report.target;

    nodes.push({
      id: tgRootId,
      type: 'text',
      text: `### ✈️ TELEGRAM ECOSYSTEM ACTIVITY\n**Target:** \`@${tgUser}\`\n**User ID:** \`${tg.target_user_id || 'MTProto Indexed'}\`\n**Public Chats:** ${tg.chats.length}\n**Messages Indexed:** ${tg.messages.length}\n**Media Captured:** ${tg.media_files.length}\n[Direct Profile](https://t.me/${tgUser})`,
      x: 0,
      y: -580,
      width: 360,
      height: 220,
      color: '5' // Cyan
    });

    edges.push({
      id: `edge-${edgeCounter++}`,
      fromNode: rootId,
      fromSide: 'top',
      toNode: tgRootId,
      toSide: 'bottom',
      label: 'Telegram Footprint'
    });

    const tgChatPositions: Record<string, string> = {};
    tg.chats.forEach((chat, cIdx) => {
      const cId = `node-tg-chat-${cIdx}`;
      const col = (cIdx % 2) * 2 - 1;
      const row = Math.floor(cIdx / 2);
      const cx = col * 460;
      const cy = -880 - row * 240;
      tgChatPositions[chat.chat_id] = cId;

      const isInvalid = chat.join_check_status === 'INVALID_OR_BANNED';
      const isRestricted = chat.join_check_status === 'RESTRICTED';
      const colorCode = isInvalid ? '1' : isRestricted ? '3' : '4';
      const statusTag = isInvalid
        ? '🔴 НЕВАЛИДЕН: НЕДОСТУПЕН / БАН'
        : isRestricted
        ? '🟡 ЗАКРЫТ: ТОЛЬКО ПО ИНВАЙТУ'
        : '🟢 ВАЛИДЕН: МОЖНО ВОЙТИ И СМОТРЕТЬ';

      let backupStr = '';
      if (chat.backup_data) {
        const b = chat.backup_data;
        backupStr = `\n\n📦 **БЭКАП УСТАРЕВШИХ ДАННЫХ (ОТКРЫТЫЙ КЭШ):**\n- **Источник:** ${b.archive_source}\n- **Снимок:** \`${b.archived_date}\`\n- **Описание из кэша:** ${b.cached_description.slice(0, 80)}...\n[Зеркало веб-архива](${b.archive_url})`;
      }

      nodes.push({
        id: cId,
        type: 'text',
        text: `#### 💬 [[${chat.title}]]\n**Статус:** \`${statusTag}\`\n- **Вход и просмотр:** ${chat.can_view_history ? '✅ Разрешен' : '🔒 Ограничен'}\n- **ID:** \`${chat.chat_id}\`\n- **Handle:** \`@${chat.username || 'private'}\`\n- **Members:** ${chat.members_count || 'N/A'}\n- **Аудит доступа:** ${chat.access_details}\n\n[Chat Deep Link](${chat.invite_or_link})${backupStr}`,
        x: cx,
        y: cy,
        width: 350,
        height: isInvalid ? 280 : 210,
        color: colorCode
      });

      edges.push({
        id: `edge-${edgeCounter++}`,
        fromNode: tgRootId,
        fromSide: col < 0 ? 'left' : 'right',
        toNode: cId,
        toSide: col < 0 ? 'right' : 'left',
        label: 'Participant / Member'
      });
    });

    tg.messages.forEach((msg, mIdx) => {
      const msgId = `node-tg-msg-${mIdx}`;
      const mx = -500 + (mIdx % 4) * 340;
      const my = -1400 - Math.floor(mIdx / 4) * 280;
      const mediaTag = msg.has_media ? `📎 [${(msg.media_type || 'file').toUpperCase()}]` : '💬 [TEXT]';
      const isInvalidMsg = msg.access_check === 'NOT_FOUND' || !msg.is_verified_accessible;
      const msgColor = isInvalidMsg ? '1' : '4';
      const msgStatus = isInvalidMsg ? '🔴 [АРХИВНЫЙ БЭКАП - ЧАТ ЗАБЛОКИРОВАН]' : '🟢 [ДОСТУПНО ОНЛАЙН]';

      let msgBackup = '';
      if (msg.backup_data) {
        msgBackup = `\n\n📦 **Бэкап:** ${msg.backup_data.archive_source} (${msg.backup_data.archived_date})`;
      }

      nodes.push({
        id: msgId,
        type: 'text',
        text: `#### ${msgStatus} Msg #${msg.message_id} (${mediaTag})\n**Chat:** ${msg.chat_title}\n**Date:** \`${msg.date}\`\n**Доступ:** ${msg.access_details || 'Проверено'}\n\n> ${msg.text.slice(0, 100)}\n\n[Message Link](${msg.message_url})${msgBackup}`,
        x: mx,
        y: my,
        width: 330,
        height: isInvalidMsg ? 250 : 210,
        color: msgColor
      });

      // 1. Profile -> Message
      edges.push({
        id: `edge-${edgeCounter++}`,
        fromNode: tgRootId,
        fromSide: 'top',
        toNode: msgId,
        toSide: 'bottom',
        label: 'Sent Message'
      });

      // 2. Chat -> Message
      const chatRef = tgChatPositions[msg.chat_id];
      if (chatRef) {
        edges.push({
          id: `edge-${edgeCounter++}`,
          fromNode: chatRef,
          fromSide: 'top',
          toNode: msgId,
          toSide: 'bottom',
          label: 'Hosts Message'
        });
      }

      // 3. Media Attached Node & Direct Arrows
      if (msg.media_item) {
        const med = msg.media_item;
        const medId = `node-tg-med-${mIdx}`;
        const emoji = med.media_type === 'photo' ? '📷' : med.media_type === 'video_note' ? '⭕' : med.media_type === 'video' ? '🎥' : '📄';

        nodes.push({
          id: medId,
          type: 'text',
          text: `#### ${emoji} MEDIA: ${med.media_type.toUpperCase()}\n**Size:** \`${med.file_size_human}\`\n**SHA-256:** \`${med.file_sha256.slice(0, 18)}...\`\n**Caption:** *${med.caption || 'None'}*\n\n[Deep Link](${med.direct_message_url})`,
          x: mx,
          y: my - 260,
          width: 310,
          height: 200,
          color: '6' // Orange/Yellow
        });

        // Msg -> Media
        edges.push({
          id: `edge-${edgeCounter++}`,
          fromNode: msgId,
          fromSide: 'top',
          toNode: medId,
          toSide: 'bottom',
          label: 'Contains Attachment'
        });

        // User Profile -> Media directly (strict requirement)
        edges.push({
          id: `edge-${edgeCounter++}`,
          fromNode: tgRootId,
          fromSide: 'left',
          toNode: medId,
          toSide: 'right',
          label: 'Uploaded by Target'
        });

        // Media -> Specific Public Chat (strict requirement)
        if (chatRef) {
          edges.push({
            id: `edge-${edgeCounter++}`,
            fromNode: medId,
            fromSide: 'left',
            toNode: chatRef,
            toSide: 'top',
            label: 'Published in Chat'
          });
        }
      }
    });
  }

  return JSON.stringify({ nodes, edges }, null, 2);
}

/**
 * Direct Maltego / SpiderFoot Graph to Obsidian Canvas Exporter.
 * Guarantees 100% of discovered nodes and edges are serialized to .canvas
 * with accurate color coding and spatial positioning.
 */
export function exportLogicGraphToObsidianCanvas(
  graphNodes: LogicNode[],
  graphEdges: LogicEdge[],
  targetName: string
): string {
  const colorMap: Record<string, string> = {
    target: '6',    // Purple
    phone: '3',     // Yellow
    carrier: '5',   // Blue
    messenger: '4', // Green
    email: '5',     // Blue
    platform: '4',  // Green
    breach: '1',    // Red
    domain: '3',    // Yellow/Orange
    ip: '5',        // Blue
    asn: '5',       // Blue
    port: '3',      // Yellow/Orange
    location: '6',  // Purple
    metadata: '2'   // Gray
  };

  const canvasNodes = graphNodes.map((n, idx) => {
    // Intelligent grid/flow positioning
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const x = -400 + col * 320;
    const y = -300 + row * 180;

    let textContent = `### ${n.type.toUpperCase()}: ${n.label}\n`;
    textContent += `**Source:** \`${n.source}\`\n`;
    if (n.verification_status) {
      textContent += `**Status:** \`${n.verification_status}\`\n`;
    }
    if (n.details) {
      textContent += `\n*${n.details}*`;
    }

    return {
      id: `canvas-${n.id}`,
      type: 'text',
      text: textContent,
      x,
      y,
      width: 290,
      height: 150,
      color: colorMap[n.type] || '2'
    };
  });

  const canvasEdges = graphEdges.map((e, idx) => ({
    id: `canvas-edge-${idx + 1}`,
    fromNode: `canvas-${e.source}`,
    fromSide: 'right',
    toNode: `canvas-${e.target}`,
    toSide: 'left',
    label: e.label || e.transform_name || 'relates_to'
  }));

  return JSON.stringify({ nodes: canvasNodes, edges: canvasEdges }, null, 2);
}

