// Crisis detection and region-aware helpline resources.
// Detection is deliberately broad: a false alarm only shows helpline numbers,
// while a miss could leave someone without help.

const crisisPatterns: RegExp[] = [
  /suicid/,
  /kill(ing)?\s+my\s?self/,
  /end(ing)?\s+(it\s+all|my\s+life|everything|it)\b/,
  /take\s+my\s+(own\s+)?life/,
  /want(ed)?\s+to\s+die/,
  /wish\s+i\s+(was|were)\s+dead/,
  /better\s+off\s+(dead|without\s+me)/,
  /(don'?t|do\s+not)\s+want\s+to\s+(live|be\s+alive|be\s+here|exist|wake\s+up)/,
  /no\s+(reason|point)\s+(to|in)\s+(live|living|going\s+on)/,
  /what'?s\s+the\s+point\s+(of|in)\s+(living|life|going\s+on)/,
  /not\s+worth\s+living/,
  /can'?t\s+go\s+on/,
  /give\s+up\s+on\s+(life|living)/,
  /(hurt|harm|cut|cutting|burn|burning)\s+my\s?self/,
  /self[\s-]?harm/,
  /overdos/,
  /hang\s+my\s?self/,
  /jump\s+off/,
  // Hindi / Hinglish
  /khud\s?kushi/,
  /aatm\s?hatya|atma\s?hatya/,
  /marna\s+chaht/,
  /mar\s+jaana\s+chaht/,
  /jeena\s+nahi\s+chaht/,
  /jeene\s+ka\s+(mann?|man)\s+nahi/
];

export const detectCrisis = (message: string): boolean => {
  const text = message.toLowerCase().replace(/[’‘]/g, "'");
  return crisisPatterns.some(pattern => pattern.test(text));
};

export interface CrisisResources {
  region: string;
  lines: string[];
}

const resourcesByCountry: Record<string, CrisisResources> = {
  IN: {
    region: 'India',
    lines: [
      'Tele-MANAS (24/7, free): 14416 or 1-800-891-4416',
      'iCall (TISS): +91 91529 87821',
      'AASRA (24/7): +91 98204 66726',
      'Emergency: 112'
    ]
  },
  US: {
    region: 'United States',
    lines: [
      '988 Suicide & Crisis Lifeline: call or text 988',
      'Crisis Text Line: text HOME to 741741',
      'Emergency: 911'
    ]
  },
  CA: {
    region: 'Canada',
    lines: [
      '9-8-8 Suicide Crisis Helpline: call or text 988',
      'Emergency: 911'
    ]
  },
  GB: {
    region: 'United Kingdom',
    lines: [
      'Samaritans (24/7, free): 116 123',
      'Shout: text SHOUT to 85258',
      'Emergency: 999'
    ]
  },
  AU: {
    region: 'Australia',
    lines: [
      'Lifeline (24/7): 13 11 14',
      'Emergency: 000'
    ]
  }
};

const fallbackResources: CrisisResources = {
  region: 'your country',
  lines: [
    'Find a free, confidential helpline near you: https://findahelpline.com',
    'If you are in immediate danger, call your local emergency number'
  ]
};

const timezoneCountries: Record<string, string> = {
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Europe/London': 'GB',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU'
};

// Timezone is checked first because many browsers report "en-US" regardless of location
const detectCountry = (): string | null => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezoneCountries[timezone]) {
      return timezoneCountries[timezone];
    }
  } catch {
    // ignore and fall through to language
  }

  const region = navigator.language?.split('-')[1]?.toUpperCase();
  return region || null;
};

export const getCrisisResources = (): CrisisResources => {
  const country = detectCountry();
  const local = country ? resourcesByCountry[country] : undefined;

  if (!local) {
    return fallbackResources;
  }

  return {
    region: local.region,
    lines: [...local.lines, 'Elsewhere: https://findahelpline.com']
  };
};

export const crisisMessage =
  "I'm really glad you told me, and I'm concerned about your safety. You don't have to go through this alone. " +
  "Please reach out right now to one of the helplines below, or to someone you trust nearby. " +
  "If you're in immediate danger, call your local emergency number. I'm still here to keep talking with you.";
