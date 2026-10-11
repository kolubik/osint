import { PhoneIntelligence, MessengerTarget } from '../types/osint';
import { TruthVerifier } from './verifier';

// Country dialing code metadata map
const COUNTRY_CODES: Record<string, { name: string; iso: string; length: number; timezones: string[] }> = {
  '1': { name: 'United States / Canada', iso: 'US', length: 10, timezones: ['UTC-5', 'UTC-6', 'UTC-7', 'UTC-8'] },
  '44': { name: 'United Kingdom', iso: 'GB', length: 10, timezones: ['UTC+0', 'UTC+1'] },
  '7': { name: 'Russia / Kazakhstan', iso: 'RU', length: 10, timezones: ['UTC+3', 'UTC+4', 'UTC+5', 'UTC+7'] },
  '49': { name: 'Germany', iso: 'DE', length: 10, timezones: ['UTC+1', 'UTC+2'] },
  '33': { name: 'France', iso: 'FR', length: 9, timezones: ['UTC+1', 'UTC+2'] },
  '34': { name: 'Spain', iso: 'ES', length: 9, timezones: ['UTC+1', 'UTC+2'] },
  '39': { name: 'Italy', iso: 'IT', length: 10, timezones: ['UTC+1', 'UTC+2'] },
  '380': { name: 'Ukraine', iso: 'UA', length: 9, timezones: ['UTC+2', 'UTC+3'] },
  '48': { name: 'Poland', iso: 'PL', length: 9, timezones: ['UTC+1', 'UTC+2'] },
  '81': { name: 'Japan', iso: 'JP', length: 10, timezones: ['UTC+9'] },
  '86': { name: 'China', iso: 'CN', length: 11, timezones: ['UTC+8'] },
  '91': { name: 'India', iso: 'IN', length: 10, timezones: ['UTC+5:30'] },
  '61': { name: 'Australia', iso: 'AU', length: 9, timezones: ['UTC+8', 'UTC+9:30', 'UTC+10'] },
  '55': { name: 'Brazil', iso: 'BR', length: 11, timezones: ['UTC-3', 'UTC-4'] },
  '31': { name: 'Netherlands', iso: 'NL', length: 9, timezones: ['UTC+1'] },
  '41': { name: 'Switzerland', iso: 'CH', length: 9, timezones: ['UTC+1'] },
  '971': { name: 'United Arab Emirates', iso: 'AE', length: 9, timezones: ['UTC+4'] },
  '972': { name: 'Israel', iso: 'IL', length: 9, timezones: ['UTC+2'] }
};

export function parsePhoneNumber(rawInput: string): PhoneIntelligence {
  const digits = rawInput.replace(/\D/g, '');
  let detectedCode = '1';
  let countryInfo = COUNTRY_CODES['1'];

  // Check 3-digit prefixes, then 2-digit, then 1-digit
  for (const prefix of ['380', '971', '972', '44', '49', '33', '34', '39', '48', '81', '86', '91', '61', '55', '31', '41', '7', '1']) {
    if (digits.startsWith(prefix)) {
      detectedCode = prefix;
      countryInfo = COUNTRY_CODES[prefix] || { name: 'International Destination', iso: 'XX', length: 10, timezones: ['UTC'] };
      break;
    }
  }

  // Format representations
  const e164 = `+${digits}`;
  const nationalDigits = digits.slice(detectedCode.length);
  const formattedNational = nationalDigits.length >= 7
    ? `(${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(3, 6)}-${nationalDigits.slice(6)}`
    : nationalDigits;
  const internationalFormat = `+${detectedCode} ${formattedNational}`;

  // Carrier & line type heuristics based on standard prefixes
  let lineType: PhoneIntelligence['line_type'] = 'Mobile';
  let carrier = 'Major Wireless Telecom';

  if (detectedCode === '1') {
    const npa = nationalDigits.slice(0, 3);
    if (['800', '888', '877', '866', '855', '844', '833'].includes(npa)) {
      lineType = 'Toll Free';
      carrier = 'Toll-Free Carrier';
    } else if (['415', '212', '312', '206'].includes(npa)) {
      carrier = 'Tier-1 Telecom (Verizon / AT&T / T-Mobile)';
    }
  } else if (detectedCode === '7') {
    const operatorPrefix = nationalDigits.slice(0, 3);
    if (['910', '911', '912', '913', '914', '915', '916', '917', '918', '919', '980', '981', '982', '983', '984', '985', '986', '987', '988', '989'].includes(operatorPrefix)) {
      carrier = 'MTS / Mobile TeleSystems';
    } else if (['920', '921', '922', '923', '924', '925', '926', '927', '928', '929', '930', '931', '932', '933', '934', '935', '936', '937', '938', '939'].includes(operatorPrefix)) {
      carrier = 'MegaFon Cellular';
    } else if (['903', '905', '906', '909', '960', '961', '962', '963', '964', '965', '966', '967', '968', '969'].includes(operatorPrefix)) {
      carrier = 'Beeline (VEON)';
    } else if (['900', '901', '902', '904', '908', '950', '951', '952', '953', '977', '991', '992', '993', '994', '995', '996'].includes(operatorPrefix)) {
      carrier = 'Tele2 / Rostelecom Mobile';
    }
  } else if (detectedCode === '44') {
    if (nationalDigits.startsWith('7')) {
      lineType = 'Mobile';
      carrier = 'UK Mobile (EE / Vodafone / O2 / Three)';
    } else {
      lineType = 'Fixed Line';
      carrier = 'BT British Telecom Landline';
    }
  }

  // Messenger links & checkers
  const messengers: MessengerTarget[] = [
    {
      name: 'WhatsApp',
      icon: 'whatsapp',
      url: `https://wa.me/${digits}`,
      app_url: `whatsapp://send?phone=${digits}`,
      status: 'Direct URI',
      notes: 'Opens direct WhatsApp chat session with target number without saving contact.'
    },
    {
      name: 'Telegram',
      icon: 'telegram',
      url: `https://t.me/+${digits}`,
      app_url: `tg://resolve?phone=${digits}`,
      status: 'Public Web',
      notes: 'Resolves public profile card, avatar, and bio linked to this mobile number.'
    },
    {
      name: 'Viber',
      icon: 'viber',
      url: `viber://chat?number=%2B${digits}`,
      app_url: `viber://chat?number=%2B${digits}`,
      status: 'Direct URI',
      notes: 'Triggers Viber protocol handler to open messaging conversation.'
    },
    {
      name: 'Skype Call / Search',
      icon: 'skype',
      url: `skype:+${digits}?call`,
      status: 'Direct URI',
      notes: 'Direct Skype telephony dialing protocol link.'
    },
    {
      name: 'Truecaller Directory',
      icon: 'phone',
      url: `https://www.truecaller.com/search/${countryInfo.iso.toLowerCase()}/${nationalDigits}`,
      status: 'Public Web',
      notes: 'Crowdsourced caller name attribution and spam reputation analysis.'
    },
    {
      name: 'Sync.me Lookup',
      icon: 'users',
      url: `https://sync.me/search/?number=${digits}`,
      status: 'Public Web',
      notes: 'Synchronized social phonebook search for full names and connected avatars.'
    }
  ];

  // Social account recovery and correlation lookups
  const socialLookups = [
    {
      platform: 'Google Account Identifier',
      lookup_url: `https://accounts.google.com/signin/v2/recoveryidentifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin`,
      query: `Recovery check for ${e164}`
    },
    {
      platform: 'VKontakte (VK) Restore',
      lookup_url: `https://vk.com/restore`,
      query: `Check profile binding for ${e164}`
    },
    {
      platform: 'Odnoklassniki (OK.ru)',
      lookup_url: `https://ok.ru/recovery`,
      query: `Restore binding check for ${e164}`
    },
    {
      platform: 'Microsoft Account ID',
      lookup_url: `https://login.live.com/`,
      query: `Sign-in identifier verify for ${e164}`
    }
  ];

  const validation = TruthVerifier.verifyPhoneNumber(rawInput);

  return {
    raw_number: rawInput,
    e164,
    national_format: formattedNational,
    international_format: internationalFormat,
    country_code: countryInfo.iso,
    country_name: countryInfo.name,
    carrier,
    line_type: lineType,
    timezones: countryInfo.timezones,
    valid: validation.is_valid,
    messengers,
    social_lookups: socialLookups
  };
}
