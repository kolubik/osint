import { EntityResult, VerificationStatus } from '../types/osint';
import { PlatformDefinition } from '../data/platforms';

export interface ClarificationDetail {
  platform: string;
  username: string;
  isFound: boolean;
  statusCode: number;
  apiEndpoint: string;
  methodUsed: string;
  evidence: string;
  latencyMs: number;
  avatarUrl?: string;
  profileUrl: string;
  metadata?: Record<string, any>;
  rawSnippet?: string;
}

// Dedicated public API definitions for platforms
export const PLATFORM_API_REGISTRY: Record<
  string,
  {
    getApiUrl: (username: string) => string;
    profileUrl: (username: string) => string;
    parseResponse: (data: any, status: number) => { isFound: boolean; metadata?: Record<string, any>; avatarUrl?: string };
  }
> = {
  GitHub: {
    getApiUrl: (u) => `https://api.github.com/users/${u}`,
    profileUrl: (u) => `https://github.com/${u}`,
    parseResponse: (data, status) => {
      if (status === 200 && data && data.login) {
        return {
          isFound: true,
          avatarUrl: data.avatar_url,
          metadata: {
            name: data.name,
            bio: data.bio,
            public_repos: data.public_repos,
            followers: data.followers,
            location: data.location,
            company: data.company
          }
        };
      }
      return { isFound: false };
    }
  },
  GitLab: {
    getApiUrl: (u) => `https://gitlab.com/api/v4/users?username=${u}`,
    profileUrl: (u) => `https://gitlab.com/${u}`,
    parseResponse: (data, status) => {
      if (status === 200 && Array.isArray(data) && data.length > 0) {
        const user = data[0];
        return {
          isFound: true,
          avatarUrl: user.avatar_url,
          metadata: {
            id: user.id,
            name: user.name,
            username: user.username,
            web_url: user.web_url
          }
        };
      }
      return { isFound: false };
    }
  },
  Reddit: {
    getApiUrl: (u) => `https://www.reddit.com/user/${u}/about.json`,
    profileUrl: (u) => `https://www.reddit.com/user/${u}`,
    parseResponse: (data, status) => {
      if (status === 200 && data && data.data && data.data.name) {
        const d = data.data;
        const icon = d.icon_img ? d.icon_img.split('?')[0] : undefined;
        return {
          isFound: true,
          avatarUrl: icon,
          metadata: {
            username: d.name,
            total_karma: d.total_karma,
            created_utc: d.created_utc ? new Date(d.created_utc * 1000).toISOString().split('T')[0] : undefined,
            verified: d.verified
          }
        };
      }
      return { isFound: false };
    }
  },
  HackerNews: {
    getApiUrl: (u) => `https://hacker-news.firebaseio.com/v0/user/${u}.json`,
    profileUrl: (u) => `https://news.ycombinator.com/user?id=${u}`,
    parseResponse: (data, status) => {
      if (status === 200 && data && data.id) {
        return {
          isFound: true,
          metadata: {
            username: data.id,
            karma: data.karma,
            created: data.created ? new Date(data.created * 1000).toISOString().split('T')[0] : undefined,
            about: data.about ? data.about.slice(0, 120) : undefined
          }
        };
      }
      return { isFound: false };
    }
  },
  'Dev.to': {
    getApiUrl: (u) => `https://dev.to/api/users/by_username?url=${u}`,
    profileUrl: (u) => `https://dev.to/${u}`,
    parseResponse: (data, status) => {
      if (status === 200 && data && data.username) {
        return {
          isFound: true,
          avatarUrl: data.profile_image,
          metadata: {
            name: data.name,
            summary: data.summary,
            joined_at: data.joined_at
          }
        };
      }
      return { isFound: false };
    }
  },
  'Chess.com': {
    getApiUrl: (u) => `https://api.chess.com/pub/player/${u.toLowerCase()}`,
    profileUrl: (u) => `https://www.chess.com/member/${u}`,
    parseResponse: (data, status) => {
      if (status === 200 && data && data.player_id) {
        return {
          isFound: true,
          avatarUrl: data.avatar,
          metadata: {
            title: data.title || 'Player',
            name: data.name,
            status: data.status,
            followers: data.followers,
            country: data.country
          }
        };
      }
      return { isFound: false };
    }
  },
  Lichess: {
    getApiUrl: (u) => `https://lichess.org/api/user/${u}`,
    profileUrl: (u) => `https://lichess.org/@/${u}`,
    parseResponse: (data, status) => {
      if (status === 200 && data && data.id) {
        return {
          isFound: true,
          metadata: {
            username: data.username,
            title: data.title,
            games_count: data.count?.all,
            profile_bio: data.profile?.bio
          }
        };
      }
      return { isFound: false };
    }
  },
  Codeberg: {
    getApiUrl: (u) => `https://codeberg.org/api/v1/users/${u}`,
    profileUrl: (u) => `https://codeberg.org/${u}`,
    parseResponse: (data, status) => {
      if (status === 200 && data && data.username) {
        return {
          isFound: true,
          avatarUrl: data.avatar_url,
          metadata: {
            full_name: data.full_name,
            website: data.website,
            location: data.location
          }
        };
      }
      return { isFound: false };
    }
  },
  Keybase: {
    getApiUrl: (u) => `https://keybase.io/_/api/1.0/user/lookup.json?usernames=${u}`,
    profileUrl: (u) => `https://keybase.io/${u}`,
    parseResponse: (data, status) => {
      if (status === 200 && data?.status?.code === 0 && data?.them?.[0]) {
        const them = data.them[0];
        return {
          isFound: true,
          avatarUrl: them.pictures?.primary?.url,
          metadata: {
            full_name: them.profile?.full_name,
            bio: them.profile?.bio,
            location: them.profile?.location
          }
        };
      }
      return { isFound: false };
    }
  },
  Bluesky: {
    getApiUrl: (u) => `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${u.includes('.') ? u : `${u}.bsky.social`}`,
    profileUrl: (u) => `https://bsky.app/profile/${u.includes('.') ? u : `${u}.bsky.social`}`,
    parseResponse: (data, status) => {
      if (status === 200 && data && data.did) {
        return {
          isFound: true,
          avatarUrl: data.avatar,
          metadata: {
            displayName: data.displayName,
            handle: data.handle,
            description: data.description,
            followersCount: data.followersCount
          }
        };
      }
      return { isFound: false };
    }
  },
  'Mastodon.social': {
    getApiUrl: (u) => `https://mastodon.social/api/v1/accounts/lookup?acct=${u}`,
    profileUrl: (u) => `https://mastodon.social/@${u}`,
    parseResponse: (data, status) => {
      if (status === 200 && data && data.id) {
        return {
          isFound: true,
          avatarUrl: data.avatar,
          metadata: {
            displayName: data.display_name,
            followersCount: data.followers_count,
            statusesCount: data.statuses_count,
            note: data.note?.replace(/<[^>]*>?/gm, '')
          }
        };
      }
      return { isFound: false };
    }
  },
  Wikipedia: {
    getApiUrl: (u) => `https://en.wikipedia.org/w/api.php?action=query&list=users&ususers=${u}&usprop=registration|editcount|gender&format=json&origin=*`,
    profileUrl: (u) => `https://en.wikipedia.org/wiki/User:${u}`,
    parseResponse: (data, status) => {
      const user = data?.query?.users?.[0];
      if (status === 200 && user && !user.missing && user.userid) {
        return {
          isFound: true,
          metadata: {
            userid: user.userid,
            editcount: user.editcount,
            registration: user.registration
          }
        };
      }
      return { isFound: false };
    }
  },
  DockerHub: {
    getApiUrl: (u) => `https://hub.docker.com/v2/users/${u}/`,
    profileUrl: (u) => `https://hub.docker.com/u/${u}`,
    parseResponse: (data, status) => {
      if (status === 200 && data && data.id) {
        return {
          isFound: true,
          metadata: {
            username: data.username,
            full_name: data.full_name,
            date_joined: data.date_joined
          }
        };
      }
      return { isFound: false };
    }
  },
  Gravatar: {
    getApiUrl: (u) => `https://en.gravatar.com/${u}.json`,
    profileUrl: (u) => `https://gravatar.com/${u}`,
    parseResponse: (data, status) => {
      if (status === 200 && data?.entry?.[0]) {
        const entry = data.entry[0];
        return {
          isFound: true,
          avatarUrl: entry.thumbnailUrl,
          metadata: {
            displayName: entry.displayName,
            profileUrl: entry.profileUrl,
            aboutMe: entry.aboutMe
          }
        };
      }
      return { isFound: false };
    }
  },
  Telegram: {
    getApiUrl: (u) => `https://t.me/s/${u}`,
    profileUrl: (u) => `https://t.me/${u}`,
    parseResponse: (data, status) => {
      // Handled via proxy parser in clarifyProfileViaApi
      return { isFound: false };
    }
  }
};

/**
 * Executes direct initial probe for a platform if an open API exists.
 */
export async function probePlatformDirect(
  plat: PlatformDefinition,
  username: string
): Promise<EntityResult> {
  const cleanU = username.trim().replace(/^@/, '');
  const targetUrl = plat.url.replace('{u}', cleanU);
  const startTime = performance.now();

  const apiDef = PLATFORM_API_REGISTRY[plat.name];
  if (apiDef) {
    const apiUrl = apiDef.getApiUrl(cleanU);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json'
        }
      });
      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - startTime);

      if (res.ok) {
        const json = await res.json().catch(() => null);
        const parsed = apiDef.parseResponse(json, res.status);
        if (parsed.isFound) {
          return {
            service_name: plat.name,
            category: plat.category,
            target_url: targetUrl,
            status: 'Found',
            verification_status: 'API_VERIFIED',
            response_time_ms: latency,
            source_tag: `${plat.name.toUpperCase().replace(/\s+/g, '_')}_REST_API`,
            api_endpoint: apiUrl,
            api_clarified: true,
            clarification_notes: `Confirmed active via official API (${res.status} OK)`,
            http_status: res.status,
            metadata: {
              ...(parsed.metadata || {}),
              avatar_url: parsed.avatarUrl
            }
          };
        }
      } else if (res.status === 404) {
        return {
          service_name: plat.name,
          category: plat.category,
          target_url: targetUrl,
          status: 'Not Found',
          verification_status: 'NOT_FOUND',
          response_time_ms: latency,
          source_tag: `${plat.name.toUpperCase().replace(/\s+/g, '_')}_API_404`,
          api_endpoint: apiUrl,
          api_clarified: true,
          clarification_notes: `Verified absent via official API (HTTP 404)`,
          http_status: 404
        };
      } else if (res.status === 429) {
        return {
          service_name: plat.name,
          category: plat.category,
          target_url: targetUrl,
          status: 'Rate Limited',
          verification_status: 'API_LIMIT_EXCEEDED',
          response_time_ms: latency,
          source_tag: `${plat.name.toUpperCase()}_API_429`,
          api_endpoint: apiUrl,
          http_status: 429,
          clarification_notes: 'API rate limit reached, manual inspection advised'
        };
      }
    } catch {
      // Network/CORS fallback proceeds below
    }
  }

  const latency = Math.round(performance.now() - startTime) || 65;
  // If endpoint is protected by browser CORS policy
  return {
    service_name: plat.name,
    category: plat.category,
    target_url: targetUrl,
    status: 'Not Found',
    verification_status: 'UNREACHABLE',
    response_time_ms: latency,
    source_tag: 'CORS_PROTECTED_ENDPOINT',
    clarification_notes: 'Initial CORS shield. Click "Clarify via API" for deep inspection.'
  };
}

/**
 * Deep Verification Engine:
 * "Уточнение наличия профиля через API" (Clarify Profile Existence via API).
 * Queries specialized JSON APIs, checks response signatures, or probes via safe proxy gateways.
 */
export async function clarifyProfileViaApi(
  platformName: string,
  username: string
): Promise<ClarificationDetail> {
  const cleanU = username.trim().replace(/^@/, '');
  const startTime = performance.now();

  const apiDef = PLATFORM_API_REGISTRY[platformName];
  const targetProfileUrl = apiDef ? apiDef.profileUrl(cleanU) : `https://${platformName.toLowerCase()}.com/${cleanU}`;

  // 1. Direct API probe if definition exists
  if (apiDef) {
    const apiUrl = apiDef.getApiUrl(cleanU);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - startTime);

      if (res.ok) {
        const json = await res.json().catch(() => null);
        const parsed = apiDef.parseResponse(json, res.status);
        if (parsed.isFound) {
          return {
            platform: platformName,
            username: cleanU,
            isFound: true,
            statusCode: res.status,
            apiEndpoint: apiUrl,
            methodUsed: 'Official REST/JSON API',
            evidence: `Verified Profile: HTTP ${res.status} OK with valid profile schema.`,
            latencyMs,
            avatarUrl: parsed.avatarUrl,
            profileUrl: targetProfileUrl,
            metadata: parsed.metadata,
            rawSnippet: JSON.stringify(json).slice(0, 200)
          };
        }
      } else if (res.status === 404) {
        return {
          platform: platformName,
          username: cleanU,
          isFound: false,
          statusCode: 404,
          apiEndpoint: apiUrl,
          methodUsed: 'Official REST/JSON API',
          evidence: `Direct API returned HTTP 404 Not Found (User Does Not Exist).`,
          latencyMs,
          profileUrl: targetProfileUrl
        };
      }
    } catch {
      // Fall through to proxy deep check
    }
  }

  // 2. Safe Proxy Deep Clarification: Bypasses browser CORS policy
  // Queries through open CORS gateway to inspect actual response status & signatures
  const probeUrl = apiDef ? apiDef.getApiUrl(cleanU) : targetProfileUrl;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(probeUrl)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const proxyRes = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    const latencyMs = Math.round(performance.now() - startTime);

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      const httpStatus = data?.status?.http_code || 200;
      const contents = data?.contents || '';

      // Platform specific signature analysis
      if (platformName === 'Telegram') {
        const isNotChannel = contents.includes('tgme_page_title') && !contents.includes("doesn't exist");
        const hasExtra = contents.includes('tgme_page_extra') || contents.includes('tgme_page_description');
        if (isNotChannel && hasExtra) {
          return {
            platform: platformName,
            username: cleanU,
            isFound: true,
            statusCode: 200,
            apiEndpoint: `https://t.me/s/${cleanU}`,
            methodUsed: 'Telegram Web Card Signature Probe',
            evidence: 'Telegram Web Profile Card detected with active public channel/handle descriptor.',
            latencyMs,
            profileUrl: `https://t.me/${cleanU}`,
            rawSnippet: contents.slice(0, 180)
          };
        }
        return {
          platform: platformName,
          username: cleanU,
          isFound: false,
          statusCode: 404,
          apiEndpoint: `https://t.me/s/${cleanU}`,
          methodUsed: 'Telegram Web Card Signature Probe',
          evidence: 'No active Telegram public profile/channel registered for this handle.',
          latencyMs,
          profileUrl: `https://t.me/${cleanU}`
        };
      }

      if (platformName === 'Steam') {
        const steamFound = !contents.includes('The specified profile could not be found') &&
                           (contents.includes('actual_persona_name') || contents.includes('playerAvatarAutoSizeInner'));
        return {
          platform: platformName,
          username: cleanU,
          isFound: steamFound,
          statusCode: steamFound ? 200 : 404,
          apiEndpoint: `https://steamcommunity.com/id/${cleanU}`,
          methodUsed: 'Steam Community DOM Signature Probe',
          evidence: steamFound ? 'Steam Community Profile detected with valid persona structure.' : 'Steam returned profile not found.',
          latencyMs,
          profileUrl: `https://steamcommunity.com/id/${cleanU}`
        };
      }

      if (platformName === 'VKontakte') {
        const vkFound = !contents.includes('User not found') && !contents.includes('Страница не найдена') && contents.includes('pp_cont');
        return {
          platform: platformName,
          username: cleanU,
          isFound: vkFound,
          statusCode: vkFound ? 200 : 404,
          apiEndpoint: `https://vk.com/${cleanU}`,
          methodUsed: 'VK DOM Signature Probe',
          evidence: vkFound ? 'VKontakte profile page confirmed active.' : 'Page not found on VKontakte.',
          latencyMs,
          profileUrl: `https://vk.com/${cleanU}`
        };
      }

      // If we got JSON via proxy
      if (apiDef) {
        try {
          const parsedJson = JSON.parse(contents);
          const parsed = apiDef.parseResponse(parsedJson, httpStatus);
          if (parsed.isFound) {
            return {
              platform: platformName,
              username: cleanU,
              isFound: true,
              statusCode: httpStatus,
              apiEndpoint: probeUrl,
              methodUsed: 'Clarified via Gateway API Proxy',
              evidence: `API verified: HTTP ${httpStatus} with authentic profile payload.`,
              latencyMs,
              avatarUrl: parsed.avatarUrl,
              profileUrl: targetProfileUrl,
              metadata: parsed.metadata,
              rawSnippet: contents.slice(0, 180)
            };
          }
        } catch {
          // not JSON
        }
      }

      // Check standard 200 vs 404
      if (httpStatus === 200 && contents.length > 500 && !contents.includes('404 Not Found') && !contents.includes('Page Not Found')) {
        return {
          platform: platformName,
          username: cleanU,
          isFound: true,
          statusCode: 200,
          apiEndpoint: probeUrl,
          methodUsed: 'Deep HTTP Response Validation',
          evidence: `HTTP 200 OK verified with active DOM size (${contents.length} bytes).`,
          latencyMs,
          profileUrl: targetProfileUrl
        };
      }

      return {
        platform: platformName,
        username: cleanU,
        isFound: false,
        statusCode: httpStatus === 200 ? 404 : httpStatus,
        apiEndpoint: probeUrl,
        methodUsed: 'Deep HTTP Response Validation',
        evidence: `HTTP ${httpStatus}: Target profile not found or page absent.`,
        latencyMs,
        profileUrl: targetProfileUrl
      };
    }
  } catch (err: any) {
    // If gateway fails
  }

  // Fallback: If network is unreachable
  return {
    platform: platformName,
    username: cleanU,
    isFound: false,
    statusCode: 0,
    apiEndpoint: probeUrl,
    methodUsed: 'Direct & Fallback API Probes',
    evidence: 'External service is rate-limited or requires active session authentication. Check Google Dork search.',
    latencyMs: Math.round(performance.now() - startTime),
    profileUrl: targetProfileUrl
  };
}
