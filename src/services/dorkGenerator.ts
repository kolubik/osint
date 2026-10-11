import { GoogleDork, TargetType } from '../types/osint';

export function generateGoogleDorks(target: string, type: TargetType): GoogleDork[] {
  const clean = target.trim().replace(/^[@+]/, '');
  const encoded = encodeURIComponent;
  const dorks: GoogleDork[] = [];

  const addDork = (
    title: string,
    category: GoogleDork['category'],
    query: string,
    description: string
  ) => {
    dorks.push({
      id: `dork_${dorks.length + 1}`,
      title,
      category,
      query,
      description,
      google_search_url: `https://www.google.com/search?q=${encoded(query)}`
    });
  };

  if (type === 'USERNAME') {
    // Profiles & Mentions
    addDork(
      'Professional & LinkedIn Mentions',
      'Profiles & Mentions',
      `site:linkedin.com/in/ "${clean}"`,
      'Discovers direct personal profile dossiers and employee records on LinkedIn.'
    );
    addDork(
      'Social Footprint Across Major Networks',
      'Profiles & Mentions',
      `site:twitter.com OR site:x.com OR site:instagram.com OR site:facebook.com "${clean}"`,
      'Searches for primary user profiles across mainstream social media.'
    );
    addDork(
      'Telegram Channels & Groups',
      'Profiles & Mentions',
      `site:t.me "${clean}"`,
      'Detects public Telegram handles, channel broadcasts, and open group chats.'
    );
    addDork(
      'Developer & Code Repositories',
      'Cloud & Repos',
      `site:github.com OR site:gitlab.com OR site:bitbucket.org "${clean}"`,
      'Identifies open-source developer accounts, authored repos, and contributor activity.'
    );
    addDork(
      'Public Pastebins & Dump Sites',
      'Credentials & Leaks',
      `site:pastebin.com OR site:ghostbin.co OR site:rentry.co "${clean}"`,
      'Finds text dumps, logs, and public paste snippets mentioning the handle.'
    );
    addDork(
      'Leaked Credentials & Password Databases',
      'Credentials & Leaks',
      `"${clean}" (password OR hash OR db_dump OR breach OR leaked OR combo)`,
      'Scans search engine indexes for credential dumps and leaked combo lists.'
    );
    addDork(
      'Indexed PDF & DOCX Records',
      'Documents & Data',
      `filetype:pdf OR filetype:docx OR filetype:xlsx "${clean}"`,
      'Uncovers indexed documents, resumes, conference papers, and PDF archives.'
    );
    addDork(
      'Forum Threads & Community Quotes',
      'Profiles & Mentions',
      `inurl:forum OR inurl:thread OR inurl:topic "${clean}"`,
      'Discovers forum discussions, tech boards, and indexed discussions.'
    );
  } else if (type === 'EMAIL') {
    const domain = clean.includes('@') ? clean.split('@')[1] : clean;
    const userPart = clean.split('@')[0];

    addDork(
      'Direct Email In Plaintext Leaks',
      'Credentials & Leaks',
      `"${clean}" (password OR passwd OR pass OR hash OR salt)`,
      'Searches public pastebins and leaked SQL dumps for exact email and password associations.'
    );
    addDork(
      'Public Pastebin Dumps',
      'Credentials & Leaks',
      `site:pastebin.com OR site:justpaste.it "${clean}"`,
      'Queries paste repositories for raw log dumps and database extracts.'
    );
    addDork(
      'Indexed Contact Spreadsheets & CSVs',
      'Documents & Data',
      `filetype:csv OR filetype:xls OR filetype:xlsx "${clean}"`,
      'Locates leaked corporate rosters, attendee lists, and lead spreadsheets.'
    );
    addDork(
      'Public PDF Resumes & Dossiers',
      'Documents & Data',
      `filetype:pdf "${clean}"`,
      'Discovers resumes, application letters, and academic publications containing the email.'
    );
    addDork(
      'Source Code & GitHub Commits',
      'Cloud & Repos',
      `site:github.com "${clean}"`,
      'Finds git author signatures, hardcoded contact configs, and commit histories.'
    );
    addDork(
      'Alternative Handles for User Part',
      'Profiles & Mentions',
      `site:linkedin.com/in/ OR site:twitter.com "${userPart}"`,
      'Correlates the local email username part against common social media handles.'
    );
  } else if (type === 'PHONE') {
    const rawDigits = clean.replace(/\D/g, '');
    const nationalStr = rawDigits.slice(-10);

    addDork(
      'International Phone Number Search',
      'Profiles & Mentions',
      `"${clean}" OR "${rawDigits}"`,
      'Exact string match across indexed web pages, contact directories, and forum posts.'
    );
    addDork(
      'WhatsApp & Messenger Mentions',
      'Profiles & Mentions',
      `site:wa.me "${nationalStr}" OR site:t.me "${nationalStr}"`,
      'Identifies direct WhatsApp chat links and Telegram contact mentions.'
    );
    addDork(
      'Resume & Job Application Documents',
      'Documents & Data',
      `filetype:pdf OR filetype:docx ("${clean}" OR "${nationalStr}")`,
      'Searches for resumes, CVs, and contract agreements listing the phone number.'
    );
    addDork(
      'Phone Lookup & Classified Ad Portals',
      'Profiles & Mentions',
      `site:avito.ru OR site:craigslist.org OR site:ebay.com "${nationalStr}"`,
      'Finds commerce listings, classified ads, and peer-to-peer sale posts.'
    );
    addDork(
      'Caller ID & Public Yellow Pages',
      'Infrastructure & Configs',
      `site:sync.me OR site:truecaller.com OR site:numlookup.com "${nationalStr}"`,
      'Discovers public crowd-sourced phone directory listings and spam classifications.'
    );
  } else if (type === 'DOMAIN' || type === 'IP') {
    addDork(
      'Subdomain Discovery & Enumeration',
      'Infrastructure & Configs',
      `site:*.${clean} -www.${clean}`,
      'Discovers indexed third-level subdomains excluding the primary WWW root.'
    );
    addDork(
      'Exposed Environment & Config Files',
      'Infrastructure & Configs',
      `site:${clean} ext:env OR ext:yml OR ext:yaml OR ext:conf OR ext:json "password"`,
      'Checks for inadvertently exposed server configurations, .env secrets, and JSON manifests.'
    );
    addDork(
      'Public Administrative Login Portals',
      'Infrastructure & Configs',
      `site:${clean} inurl:admin OR inurl:login OR inurl:cpanel OR inurl:portal`,
      'Locates internal staff login forms, SSO gateways, and administration consoles.'
    );
    addDork(
      'Exposed Server Log Files',
      'Credentials & Leaks',
      `site:${clean} ext:log OR inurl:access.log OR inurl:error.log`,
      'Finds exposed web server activity logs, debug traces, and runtime exceptions.'
    );
    addDork(
      'Indexed PDF & Office Documents',
      'Documents & Data',
      `site:${clean} filetype:pdf OR filetype:docx OR filetype:xlsx`,
      'Extracts public documents, financial statements, and organizational filings.'
    );
    addDork(
      'Third-Party Code Repositories With Domain',
      'Cloud & Repos',
      `site:github.com "${clean}" (api_key OR token OR secret OR password)`,
      'Finds leaked API tokens, development staging urls, and keys related to the domain.'
    );
    addDork(
      'Trello & Notion Public Workspaces',
      'Cloud & Repos',
      `site:trello.com "${clean}" OR site:notion.site "${clean}"`,
      'Finds exposed Kanban boards, employee onboarding portals, and internal project wikis.'
    );
  } else {
    // Default / EXIF
    addDork(
      'Public Document Mentions',
      'Documents & Data',
      `filetype:pdf "${clean}"`,
      'Searches for exact string mentions in PDF files.'
    );
    addDork(
      'General Threat Intel & Paste Searches',
      'Credentials & Leaks',
      `site:pastebin.com "${clean}"`,
      'Looks for text dumps and configuration pastes.'
    );
  }

  return dorks;
}
