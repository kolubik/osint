import { BgpData } from '../types/osint';

export async function queryBgpAndIp(ip: string): Promise<BgpData | null> {
  const cleanIp = ip.trim();
  try {
    const res = await fetch(`https://api.bgpview.io/ip/${encodeURIComponent(cleanIp)}`);
    if (res.ok) {
      const json = await res.json();
      const d = json.data || {};
      const prefix = d.prefixes && d.prefixes.length > 0 ? d.prefixes[0] : null;
      
      const bgpInfo: BgpData = {
        ip: cleanIp,
        ptr_record: d.ptr_record,
        rir_name: d.rir_allocation?.rir_name,
        country_code: d.rir_allocation?.country_code,
        prefix: d.rir_allocation?.prefix
      };

      if (prefix && prefix.asn) {
        bgpInfo.asn = {
          asn: prefix.asn.asn,
          name: prefix.asn.name,
          description: prefix.asn.description,
          country: prefix.asn.country_code
        };
      }

      return bgpInfo;
    }
  } catch (err) {
    console.warn('BGPView query failed, trying alternative:', err);
  }

  // Fallback public IP API
  try {
    const fallbackRes = await fetch(`https://ipapi.co/${encodeURIComponent(cleanIp)}/json/`);
    if (fallbackRes.ok) {
      const fb = await fallbackRes.json();
      return {
        ip: cleanIp,
        country_code: fb.country_code,
        prefix: fb.network,
        asn: {
          asn: parseInt(fb.asn?.replace('AS', '') || '0', 10),
          name: fb.org || fb.asn,
          description: `${fb.city || ''}, ${fb.region || ''}`,
          country: fb.country_code
        }
      };
    }
  } catch (e) {
    console.warn('Fallback IP API failed:', e);
  }

  return null;
}
