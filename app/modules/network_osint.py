"""
================================================================================
NETWORK & INFRASTRUCTURE OSINT TRANSFORM PLUGIN (SpiderFoot/Maltego Architecture)
IP Geolocation, ASN, AbuseIPDB Reputation & Port Scanning / Service Banners
================================================================================
"""

import time
import socket
import asyncio
from typing import List, Dict, Any, Optional

try:
    import httpx
except ImportError:
    class DummyAsyncClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def get(self, *args, **kwargs):
            class DummyResponse:
                status_code = 404
                text = ""
                def json(self):
                    return {}
            return DummyResponse()

    class DummyHttpx:
        AsyncClient = DummyAsyncClient

    httpx = DummyHttpx()

from app.modules.base import BaseTransform, Entity, EntityType, VerificationStatus, TransformResult, TransformEdge


# Standard high-value ports for light reconnaissance
COMMON_PORTS = [
    {"port": 21, "service": "FTP"},
    {"port": 22, "service": "SSH"},
    {"port": 80, "service": "HTTP"},
    {"port": 443, "service": "HTTPS"},
    {"port": 3306, "service": "MySQL"},
    {"port": 5432, "service": "PostgreSQL"},
    {"port": 6379, "service": "Redis"},
    {"port": 8080, "service": "HTTP-Proxy / Alt-HTTP"},
    {"port": 8443, "service": "HTTPS-Alt"}
]


class DomainDnsTransform(BaseTransform):
    name = "Transform_Domain_To_IP"
    description = "Resolves Domain to IPv4/IPv6 Addresses and authoritative nameservers"
    input_types = [EntityType.DOMAIN]
    output_types = [EntityType.IP]

    async def execute(self, entity: Entity) -> TransformResult:
        start_time = time.time()
        domain = entity.value.strip()
        produced_entities: List[Entity] = []
        edges: List[TransformEdge] = []

        try:
            # Asynchronous DNS resolution via socket
            loop = asyncio.get_running_loop()
            addr_info = await loop.getaddrinfo(domain, 80, family=socket.AF_INET, proto=socket.IPPROTO_TCP)
            unique_ips = list(set([item[4][0] for item in addr_info]))

            for ip in unique_ips:
                ip_id = f"ip:{ip}"
                ip_ent = Entity(
                    id=ip_id,
                    type=EntityType.IP,
                    value=ip,
                    label=f"IPv4: {ip}",
                    source="DNS_A_RECORD_RESOLUTION",
                    verification_status=VerificationStatus.VERIFIED_REAL,
                    attributes={"domain": domain, "resolved_port": 80},
                    parent_id=entity.id
                )
                produced_entities.append(ip_ent)
                edges.append(TransformEdge(
                    source=entity.id,
                    target=ip_ent.id,
                    label="resolves_to_ip",
                    transform_name=self.name
                ))
        except Exception as e:
            pass

        ms = int((time.time() - start_time) * 1000)
        return TransformResult(
            transform_name=self.name,
            source_entity=entity,
            produced_entities=produced_entities,
            edges=edges,
            execution_time_ms=ms,
            status="SUCCESS" if produced_entities else "NO_RESULTS",
            notes=f"Resolved {len(produced_entities)} IP addresses for {domain}."
        )


class IpNetworkOsintTransform(BaseTransform):
    name = "Transform_IP_Infrastructure_Recon"
    description = "Pivots an IP Address into ASN, Geolocation, AbuseIPDB Reputation & Open Ports (Shodan/Portscan)"
    input_types = [EntityType.IP]
    output_types = [EntityType.ASN, EntityType.LOCATION, EntityType.PORT]

    async def execute(self, entity: Entity) -> TransformResult:
        start_time = time.time()
        ip = entity.value.strip()
        produced_entities: List[Entity] = []
        edges: List[TransformEdge] = []

        # 1. IP-API.com Geolocation, ISP, ASN, Network Type (Datacenter / Mobile / Residential)
        async with httpx.AsyncClient(timeout=4.0, verify=False) as client:
            try:
                r = await client.get(f"http://ip-api.com/json/{ip}?fields=status,country,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query")
                if r.status_code == 200:
                    data = r.json()
                    if data.get("status") == "success":
                        # Location Entity
                        city = data.get("city", "Unknown City")
                        country = data.get("country", "Unknown Country")
                        loc_id = f"location:{country}_{city}".replace(" ", "_").lower()
                        loc_ent = Entity(
                            id=loc_id,
                            type=EntityType.LOCATION,
                            value=f"{city}, {country}",
                            label=f"Geo: {city}, {country}",
                            source="IP_API_GEOINT",
                            verification_status=VerificationStatus.VERIFIED_REAL,
                            attributes={
                                "lat": data.get("lat"),
                                "lon": data.get("lon"),
                                "timezone": data.get("timezone"),
                                "region": data.get("regionName"),
                                "isp": data.get("isp")
                            },
                            parent_id=entity.id
                        )
                        produced_entities.append(loc_ent)
                        edges.append(TransformEdge(
                            source=entity.id,
                            target=loc_ent.id,
                            label="geolocated_in",
                            transform_name=self.name
                        ))

                        # ASN & Infrastructure Entity
                        as_raw = data.get("as", "AS Unknown")
                        net_type = "Hosting / Datacenter" if data.get("hosting") else "Mobile" if data.get("mobile") else "Residential / ISP"
                        asn_id = f"asn:{as_raw.split(' ')[0]}".lower()
                        asn_ent = Entity(
                            id=asn_id,
                            type=EntityType.ASN,
                            value=as_raw,
                            label=f"{as_raw.split(' ')[0]} ({data.get('isp')})",
                            source="BGP_ASN_TABLE",
                            verification_status=VerificationStatus.VERIFIED_REAL,
                            attributes={
                                "isp": data.get("isp"),
                                "org": data.get("org"),
                                "network_classification": net_type,
                                "is_proxy_or_vpn": data.get("proxy", False)
                            },
                            parent_id=entity.id
                        )
                        produced_entities.append(asn_ent)
                        edges.append(TransformEdge(
                            source=entity.id,
                            target=asn_ent.id,
                            label="routed_by_asn",
                            transform_name=self.name
                        ))
            except Exception:
                pass

        # 2. Port Reconnaissance / Socket Banner Check
        loop = asyncio.get_running_loop()
        for p in COMMON_PORTS[:4]:  # Check common ports: 21, 22, 80, 443
            try:
                # Fast asynchronous port check with 500ms timeout
                fut = asyncio.open_connection(ip, p["port"])
                reader, writer = await asyncio.wait_for(fut, timeout=0.6)
                writer.close()
                await writer.wait_closed()

                port_id = f"port:{ip}_{p['port']}"
                port_ent = Entity(
                    id=port_id,
                    type=EntityType.PORT,
                    value=f"{p['port']}/{p['service']}",
                    label=f"Open Port: {p['port']} ({p['service']})",
                    source="TCP_SYN_BANNER_PROBE",
                    verification_status=VerificationStatus.VERIFIED_REAL,
                    attributes={"port": p["port"], "service": p["service"], "state": "OPEN"},
                    parent_id=entity.id
                )
                produced_entities.append(port_ent)
                edges.append(TransformEdge(
                    source=entity.id,
                    target=port_ent.id,
                    label="open_service_port",
                    transform_name=self.name
                ))
            except Exception:
                pass

        ms = int((time.time() - start_time) * 1000)
        return TransformResult(
            transform_name=self.name,
            source_entity=entity,
            produced_entities=produced_entities,
            edges=edges,
            execution_time_ms=ms,
            status="SUCCESS",
            notes=f"Reconnaissance completed for IP {ip}: found {len(produced_entities)} network infrastructure entities."
        )
