import { DnsRecordSet } from '../types/osint';

// DNS Record type numbers
const TYPE_MAP: Record<string, number> = {
  A: 1,
  NS: 2,
  SOA: 6,
  PTR: 12,
  MX: 15,
  TXT: 16,
  AAAA: 28
};

export async function queryDnsDoH(target: string): Promise<DnsRecordSet> {
  const cleanTarget = target.trim().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  const results: DnsRecordSet = {
    A: [],
    AAAA: [],
    MX: [],
    TXT: [],
    NS: [],
    SOA: [],
    PTR: []
  };

  const typesToQuery = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'SOA'];
  
  // Query Google DoH and Cloudflare DoH
  await Promise.allSettled(
    typesToQuery.map(async (rtype) => {
      try {
        const typeNum = TYPE_MAP[rtype] || 1;
        const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(cleanTarget)}&type=${typeNum}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.Answer && Array.isArray(data.Answer)) {
            const records = data.Answer.map((ans: any) => String(ans.data));
            results[rtype as keyof DnsRecordSet] = records;
          }
        }
      } catch (e) {
        console.warn(`DNS lookup failed for ${rtype}:`, e);
      }
    })
  );

  return results;
}
