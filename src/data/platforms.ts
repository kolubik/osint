export interface PlatformDefinition {
  name: string;
  url: string;
  category: 'Developer' | 'Social' | 'Gaming' | 'Content' | 'Security' | 'Profile' | 'Archive' | 'Media' | 'Forums';
  icon?: string;
  checkMethod: 'github_api' | 'hn_api' | 'reddit_json' | 'devto_api' | 'cors_fetch' | 'probabilistic_heuristics';
  apiUrl?: string;
}

export const PLATFORMS_LIST: PlatformDefinition[] = [
  // Developer
  { name: 'GitHub', url: 'https://github.com/{u}', category: 'Developer', checkMethod: 'github_api' },
  { name: 'GitLab', url: 'https://gitlab.com/{u}', category: 'Developer', checkMethod: 'cors_fetch' },
  { name: 'HackerNews', url: 'https://news.ycombinator.com/user?id={u}', category: 'Developer', checkMethod: 'hn_api' },
  { name: 'Dev.to', url: 'https://dev.to/{u}', category: 'Developer', checkMethod: 'devto_api' },
  { name: 'Codeberg', url: 'https://codeberg.org/{u}', category: 'Developer', checkMethod: 'cors_fetch' },
  { name: 'DockerHub', url: 'https://hub.docker.com/u/{u}', category: 'Developer', checkMethod: 'cors_fetch' },
  { name: 'PyPI', url: 'https://pypi.org/user/{u}/', category: 'Developer', checkMethod: 'cors_fetch' },
  { name: 'NPM', url: 'https://www.npmjs.com/~{u}', category: 'Developer', checkMethod: 'cors_fetch' },
  { name: 'StackOverflow', url: 'https://stackoverflow.com/users/{u}', category: 'Developer', checkMethod: 'cors_fetch' },
  { name: 'Bitbucket', url: 'https://bitbucket.org/{u}/', category: 'Developer', checkMethod: 'cors_fetch' },
  { name: 'Replit', url: 'https://replit.com/@{u}', category: 'Developer', checkMethod: 'cors_fetch' },
  { name: 'Kaggle', url: 'https://www.kaggle.com/{u}', category: 'Developer', checkMethod: 'cors_fetch' },

  // Social & Messaging
  { name: 'Telegram', url: 'https://t.me/{u}', category: 'Social', checkMethod: 'cors_fetch' },
  { name: 'Reddit', url: 'https://www.reddit.com/user/{u}', category: 'Social', checkMethod: 'reddit_json' },
  { name: 'VKontakte', url: 'https://vk.com/{u}', category: 'Social', checkMethod: 'cors_fetch' },
  { name: 'X / Twitter', url: 'https://x.com/{u}', category: 'Social', checkMethod: 'cors_fetch' },
  { name: 'Mastodon', url: 'https://mastodon.social/@{u}', category: 'Social', checkMethod: 'cors_fetch' },
  { name: 'Bluesky', url: 'https://bsky.app/profile/{u}.bsky.social', category: 'Social', checkMethod: 'cors_fetch' },
  { name: 'Pinterest', url: 'https://www.pinterest.com/{u}/', category: 'Social', checkMethod: 'cors_fetch' },
  { name: 'Tumblr', url: 'https://{u}.tumblr.com', category: 'Social', checkMethod: 'cors_fetch' },
  { name: 'Keybase', url: 'https://keybase.io/{u}', category: 'Security', checkMethod: 'cors_fetch' },

  // Gaming
  { name: 'Steam', url: 'https://steamcommunity.com/id/{u}', category: 'Gaming', checkMethod: 'cors_fetch' },
  { name: 'Twitch', url: 'https://www.twitch.tv/{u}', category: 'Gaming', checkMethod: 'cors_fetch' },
  { name: 'Chess.com', url: 'https://www.chess.com/member/{u}', category: 'Gaming', checkMethod: 'cors_fetch' },
  { name: 'Lichess', url: 'https://lichess.org/@/{u}', category: 'Gaming', checkMethod: 'cors_fetch' },
  { name: 'Roblox', url: 'https://www.roblox.com/user.aspx?username={u}', category: 'Gaming', checkMethod: 'cors_fetch' },

  // Content & Media
  { name: 'Medium', url: 'https://medium.com/@{u}', category: 'Content', checkMethod: 'cors_fetch' },
  { name: 'Substack', url: 'https://{u}.substack.com', category: 'Content', checkMethod: 'cors_fetch' },
  { name: 'Spotify', url: 'https://open.spotify.com/user/{u}', category: 'Media', checkMethod: 'cors_fetch' },
  { name: 'SoundCloud', url: 'https://soundcloud.com/{u}', category: 'Media', checkMethod: 'cors_fetch' },
  { name: 'YouTube', url: 'https://www.youtube.com/@{u}', category: 'Media', checkMethod: 'cors_fetch' },
  { name: 'Vimeo', url: 'https://vimeo.com/{u}', category: 'Media', checkMethod: 'cors_fetch' },
  { name: 'Bandcamp', url: 'https://bandcamp.com/{u}', category: 'Media', checkMethod: 'cors_fetch' },
  { name: 'Letterboxd', url: 'https://letterboxd.com/{u}/', category: 'Media', checkMethod: 'cors_fetch' },
  { name: 'Goodreads', url: 'https://www.goodreads.com/{u}', category: 'Media', checkMethod: 'cors_fetch' },

  // Creative & Design
  { name: 'Behance', url: 'https://www.behance.net/{u}', category: 'Profile', checkMethod: 'cors_fetch' },
  { name: 'Dribbble', url: 'https://dribbble.com/{u}', category: 'Profile', checkMethod: 'cors_fetch' },
  { name: 'ArtStation', url: 'https://www.artstation.com/{u}', category: 'Profile', checkMethod: 'cors_fetch' },
  { name: 'Flickr', url: 'https://www.flickr.com/people/{u}/', category: 'Profile', checkMethod: 'cors_fetch' },
  { name: '500px', url: 'https://500px.com/p/{u}', category: 'Profile', checkMethod: 'cors_fetch' },

  // Profiles, Portfolios & Archives
  { name: 'Pastebin', url: 'https://pastebin.com/u/{u}', category: 'Archive', checkMethod: 'cors_fetch' },
  { name: 'Archive.org', url: 'https://archive.org/details/@{u}', category: 'Archive', checkMethod: 'cors_fetch' },
  { name: 'About.me', url: 'https://about.me/{u}', category: 'Profile', checkMethod: 'cors_fetch' },
  { name: 'Gravatar', url: 'https://gravatar.com/{u}', category: 'Profile', checkMethod: 'cors_fetch' },
  { name: 'Disqus', url: 'https://disqus.com/by/{u}/', category: 'Forums', checkMethod: 'cors_fetch' },
  { name: 'Patreon', url: 'https://www.patreon.com/{u}', category: 'Content', checkMethod: 'cors_fetch' },
  { name: 'ProductHunt', url: 'https://www.producthunt.com/@{u}', category: 'Profile', checkMethod: 'cors_fetch' },
  { name: 'BuyMeACoffee', url: 'https://www.buymeacoffee.com/{u}', category: 'Profile', checkMethod: 'cors_fetch' },
  { name: 'Ko-fi', url: 'https://ko-fi.com/{u}', category: 'Profile', checkMethod: 'cors_fetch' },
  { name: 'Linktree', url: 'https://linktr.ee/{u}', category: 'Profile', checkMethod: 'cors_fetch' },
  { name: 'Carrd', url: 'https://{u}.carrd.co', category: 'Profile', checkMethod: 'cors_fetch' },
  { name: 'Instructables', url: 'https://www.instructables.com/member/{u}/', category: 'Profile', checkMethod: 'cors_fetch' },
  { name: 'TripAdvisor', url: 'https://www.tripadvisor.com/Profile/{u}', category: 'Profile', checkMethod: 'cors_fetch' },
  { name: 'TradingView', url: 'https://www.tradingview.com/u/{u}/', category: 'Profile', checkMethod: 'cors_fetch' }
];
