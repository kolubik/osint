export type TargetType = 'USERNAME' | 'DOMAIN' | 'IP' | 'EMAIL' | 'IMAGE_EXIF' | 'PHONE';

export type VerificationStatus =
  | 'VERIFIED_REAL'
  | 'API_VERIFIED'
  | 'CLARIFIED_VIA_API'
  | 'NOT_FOUND'
  | 'API_LIMIT_EXCEEDED'
  | 'UNREACHABLE'
  | 'INVALID_TARGET';

export interface EntityResult {
  service_name: string;
  category: string;
  target_url: string;
  status: 'Found' | 'Not Found' | 'Rate Limited' | 'Timeout' | 'Error';
  verification_status?: VerificationStatus;
  response_time_ms: number;
  source_tag: string;
  metadata?: Record<string, any>;
  api_endpoint?: string;
  api_clarified?: boolean;
  clarification_notes?: string;
  http_status?: number;
}

export interface DnsRecordSet {
  A?: string[];
  AAAA?: string[];
  MX?: string[];
  TXT?: string[];
  NS?: string[];
  SOA?: string[];
  PTR?: string[];
}

export interface BgpData {
  ip: string;
  ptr_record?: string;
  rir_name?: string;
  country_code?: string;
  prefix?: string;
  asn?: {
    asn: number;
    name: string;
    description: string;
    country: string;
  };
}

export interface GeointData {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  camera_make: string | null;
  camera_model: string | null;
  datetime_original: string | null;
  software: string | null;
  address: string | null;
  country: string | null;
  google_maps_url: string | null;
  osm_url: string | null;
  yandex_maps_url: string | null;
  suncalc_url: string | null;
  sentinel_url: string | null;
  raw_exif?: Record<string, string>;
  image_preview_url?: string;
}

export interface LogicNode {
  id: string;
  label: string;
  type: 'target' | 'platform' | 'domain' | 'ip' | 'asn' | 'location' | 'metadata' | 'breach' | 'phone' | 'email' | 'carrier' | 'messenger' | 'port';
  source: string;
  verification_status?: VerificationStatus;
  details?: string;
  attributes?: Record<string, any>;
  x?: number;
  y?: number;
}

export interface LogicEdge {
  source: string;
  target: string;
  label: string;
  transform_name?: string;
}

export interface LogicChain {
  nodes: LogicNode[];
  edges: LogicEdge[];
}

export interface MaltegoTransformInfo {
  id: string;
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
}

export interface MaltegoChainResult {
  seed_entity: {
    id: string;
    type: string;
    value: string;
    label: string;
  };
  nodes: LogicNode[];
  edges: LogicEdge[];
  transforms_executed: string[];
  total_execution_time_ms: number;
  chain_summary: string;
}

export interface TechnicalReport {
  target: string;
  is_ip: boolean;
  dns: DnsRecordSet;
  bgp?: BgpData;
  headers?: Record<string, string>;
  ssl_status?: string;
}

export interface MessengerTarget {
  name: string;
  icon: string;
  url: string;
  app_url?: string;
  status: 'Verified Link' | 'Direct URI' | 'Public Web';
  notes: string;
}

export interface PhoneIntelligence {
  raw_number: string;
  e164: string;
  national_format: string;
  international_format: string;
  country_code: string;
  country_name: string;
  carrier: string;
  line_type: 'Mobile' | 'Fixed Line' | 'VoIP' | 'Toll Free' | 'Unknown';
  timezones: string[];
  valid: boolean;
  messengers: MessengerTarget[];
  social_lookups: Array<{
    platform: string;
    lookup_url: string;
    query: string;
  }>;
}

export interface RegisteredService {
  service: string;
  category: 'Tech & Dev' | 'Social & Chat' | 'Entertainment & Media' | 'Shopping & Finance' | 'Adult / Privacy';
  registered: boolean;
  confidence: 'High' | 'Medium' | 'Unverified';
  verification_status?: VerificationStatus;
  source_tag: string;
  profile_url?: string;
}

export interface BreachRecord {
  name: string;
  title: string;
  domain: string;
  breach_date: string;
  pwn_count: number;
  data_classes: string[];
  description: string;
  is_verified: boolean;
}

export interface PasswordAuditResult {
  tested_sha1_prefix: string;
  suffix_matches: number;
  compromised: boolean;
  occurrences: number;
}

export interface EmailBreachIntelligence {
  email: string;
  domain: string;
  registered_services: RegisteredService[];
  breaches: BreachRecord[];
  password_audit?: PasswordAuditResult;
  risk_level: 'High' | 'Medium' | 'Low' | 'Clean';
}

export interface GoogleDork {
  id: string;
  title: string;
  category: 'Credentials & Leaks' | 'Profiles & Mentions' | 'Documents & Data' | 'Infrastructure & Configs' | 'Cloud & Repos';
  query: string;
  description: string;
  google_search_url: string;
}

export interface TelegramChat {
  chat_id: string;
  title: string;
  username?: string;
  chat_type: string;
  members_count?: number;
  is_public: boolean;
  invite_or_link: string;
  join_check_status: 'VALID_OPEN' | 'RESTRICTED' | 'INVALID_OR_BANNED';
  access_details: string;
  can_view_history: boolean;
  preview_web_url?: string;
  last_checked_at?: string;
}

export interface TelegramMediaItem {
  media_id: string;
  message_id: number;
  chat_id: string;
  chat_username?: string;
  media_type: 'photo' | 'video' | 'video_note' | 'document' | 'voice' | 'file';
  mime_type: string;
  file_name?: string;
  file_size_bytes: number;
  file_size_human: string;
  file_sha256: string;
  caption: string;
  date: string;
  direct_message_url: string;
  is_accessible?: boolean;
}

export interface TelegramMessage {
  message_id: number;
  chat_id: string;
  chat_title: string;
  chat_username?: string;
  sender_username: string;
  sender_id?: string;
  date: string;
  text: string;
  has_media: boolean;
  media_type?: string;
  media_item?: TelegramMediaItem;
  message_url: string;
  matched_keywords?: string[];
  is_verified_accessible?: boolean;
  access_check?: 'ACCESSIBLE' | 'RESTRICTED_CHAT' | 'NOT_FOUND';
}

export interface TelegramActivityReport {
  target_username: string;
  target_user_id?: string;
  target_display_name?: string;
  profile_status?: 'ACTIVE_PROFILE' | 'NOT_FOUND' | 'RESTRICTED';
  profile_bio?: string;
  profile_avatar_url?: string;
  is_telethon_authenticated: boolean;
  total_chats_found: number;
  total_messages_found: number;
  total_media_found: number;
  valid_open_chats_count: number;
  restricted_chats_count: number;
  invalid_chats_count: number;
  chats: TelegramChat[];
  messages: TelegramMessage[];
  media_files: TelegramMediaItem[];
  activity_summary: {
    total_chats: number;
    total_messages: number;
    total_media: number;
    valid_open_chats?: number;
    restricted_chats?: number;
    invalid_chats?: number;
    media_breakdown: {
      photos: number;
      videos: number;
      video_notes_rounds: number;
      documents: number;
    };
    most_active_chat: string;
    telethon_userbot_connected: boolean;
  };
  query_timestamp: string;
}

export interface ScanReport {
  scan_id: string;
  target: string;
  target_type: TargetType;
  timestamp: string;
  entities: EntityResult[];
  technical?: TechnicalReport;
  geoint?: GeointData;
  phone?: PhoneIntelligence;
  email_breach?: EmailBreachIntelligence;
  telegram_activity?: TelegramActivityReport;
  google_dorks?: GoogleDork[];
  logic_chain: LogicChain;
  summary: {
    total_checked?: number;
    total_found?: number;
    has_gps?: boolean;
    primary_ip?: string;
    breach_count?: number;
    dork_count?: number;
    telegram_messages?: number;
    telegram_media?: number;
  };
}
