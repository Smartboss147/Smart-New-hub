import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { Source, Post, BettingTip } from '../types.js';
import { sanitizeForFirebase } from '../utils.js';

const DB_FILE = process.env.VERCEL 
  ? '/tmp/db.json' 
  : path.join(process.cwd(), 'data', 'db.json');

// Make sure parent folder exists
const dir = path.dirname(DB_FILE);
try {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (err) {
  console.error('Warning: Failed to create local DB directory:', err);
}

interface DBState {
  sources: Source[];
  posts: Post[];
  bettingTips?: BettingTip[];
  xConfig: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
    isConnected: boolean;
    xHandle?: string;
  };
  instagramConfig?: {
    accessToken: string;
    businessAccountId: string;
    isConnected: boolean;
    instagramHandle?: string;
  };
}

const DEFAULT_SOURCES: Source[] = [
  {
    id: 'src-wired',
    name: 'Wired News',
    type: 'rss_feed',
    url: 'https://www.wired.com/feed/rss',
    category: 'Technology',
    isActive: true,
    addedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'src-techcrunch',
    name: 'TechCrunch',
    type: 'rss_feed',
    url: 'https://techcrunch.com/feed/',
    category: 'Technology',
    isActive: true,
    addedAt: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'src-coindesk',
    name: 'CoinDesk Crypto',
    type: 'rss_feed',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'Cryptocurrency',
    isActive: true,
    addedAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'src-bbc',
    name: 'BBC World News',
    type: 'rss_feed',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'Breaking News',
    isActive: true,
    addedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'src-gamespot',
    name: 'GameSpot Feed',
    type: 'rss_feed',
    url: 'https://www.gamespot.com/feeds/news/',
    category: 'Gaming',
    isActive: true,
    addedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'src-tundeednut',
    name: '@mazi_tundeednut Instagram',
    type: 'instagram_handle',
    url: '@mazi_tundeednut',
    category: 'Entertainment',
    isActive: true,
    addedAt: new Date().toISOString()
  }
];

const DEFAULT_POSTS: Post[] = [
  {
    id: 'post-pending-1',
    sourceId: 'src-techcrunch',
    sourceName: 'TechCrunch',
    sourceTitle: 'OpenAI announces advanced reasoning model code-named Strawberry',
    sourceContent: 'OpenAI has officially launched its highly anticipated Strawberry model, designated as o1, which is engineered to solve complex science, coding, and mathematical problems. The model utilizes reinforcing training methods and spends more time thinking before answering to arrive at more accurate conclusions.',
    sourceUrl: 'https://techcrunch.com/openai-strawberry-launch',
    category: 'Technology',
    generatedSummary: 'OpenAI launches o1 ( Strawberry), an AI model focusing on advanced logical reasoning, STEM domains, and high-difficulty programming, spending extra time refining outputs before answering.',
    generatedKeyFacts: [
      'Engineered for coding, mathematics, and scientific logic.',
      'Utilizes advanced reinforcement learning.',
      'Features a hidden "thinking process" before responding.'
    ],
    headlineVariations: [
      'OpenAI Officially Launches " Strawberry" Reasoning Model o1',
      'The Era of AI Reasoning: OpenAI Unveils o1',
      'Behind OpenAI’s New Mathematical and Coding Powerhouse: o1'
    ],
    suggestedPosts: [
      'OpenAI has released "o1" (Strawberry), its first AI model with actual multi-step reasoning. It excels at complex programming, advanced math, and scientific proofing by taking extra time to "think" through responses. Is this the jump from chatbot to agent?',
      'AI just got a reasoning upgrade. OpenAI has officially unveiled o1, built with a reinforcement learning loop designed to solve high-difficulty STEM problems. The AI spends up to 20 seconds pondering before outputting. A massive shift.',
      'Exciting news in tech! OpenAI launched o1 (Strawberry), specializing in complex math and code. It takes a few seconds to map its logic steps before replying, resulting in significantly fewer errors.'
    ],
    selectedPostText: 'OpenAI has released "o1" (Strawberry), its first AI model with actual multi-step reasoning. It excels at complex programming, advanced math, and scientific proofing by taking extra time to "think" through responses. Is this the jump from chatbot to agent?',
    similarityScore: 18,
    aiConfidenceScore: 94,
    suggestedHashtags: ['OpenAI', 'AIReasoning', 'o1Model', 'TechNews'],
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Neural Network visualization representing the o1 advanced reasoning architecture.',
    detectedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), // 1 hour ago
    status: 'pending',
    safetyStatus: {
      isDuplicate: false,
      rateLimitWarning: false,
      riskLevel: 'low',
      riskMessage: 'Safe to post. Highly original and natural tone.'
    }
  },
  {
    id: 'post-pending-2',
    sourceId: 'src-coindesk',
    sourceName: 'CoinDesk Crypto',
    sourceTitle: 'Bitcoin holds above $90k as institutional inflows reach record high',
    sourceContent: 'Bitcoin is trading steadily above the major psychological resistance of ninety thousand dollars, driven by an unprecedented volume of institutional inflows into spot exchange-traded funds (ETFs) and strong corporate treasury interest.',
    sourceUrl: 'https://coindesk.com/bitcoin-holds-above-90k',
    category: 'Cryptocurrency',
    generatedSummary: 'Bitcoin remains stable above the $90,000 threshold, backed by major capital injections from corporate treasuries and spot ETFs.',
    generatedKeyFacts: [
      'Bitcoin consolidates above ninety thousand dollars.',
      'Record-breaking inflows into spot Bitcoin ETFs.',
      'Corporate treasury acquisition continues to build buy pressure.'
    ],
    headlineVariations: [
      'Bitcoin Maintains Strength Above $90,000 Milestone',
      'Institutional Inflows Fuel Bitcoins $90k Consolidation',
      'ETFs Drive Bitcoin to Sustained Post-Halving Highs'
    ],
    suggestedPosts: [
      'Bitcoin continues to hold solid ground above the $90K mark. Unprecedented institutional inflows into spot ETFs, paired with constant corporate treasury purchases, are creating a strong support level. The macro landscape is shifting fast.',
      'Institutions are quietly locking in Bitcoin above $90,000. Spot ETF inflows just hit a record peak, proving that corporate interest isn’t slowing down. Bullish macro tailwinds continue.',
      'Bitcoin consolidates above $90,000 with institutional buying at an all-time high! ETF demand is outstripping supply. A new era for digital assets is solidifying.'
    ],
    selectedPostText: 'Bitcoin continues to hold solid ground above the $90K mark. Unprecedented institutional inflows into spot ETFs, paired with constant corporate treasury purchases, are creating a strong support level. The macro landscape is shifting fast.',
    similarityScore: 12,
    aiConfidenceScore: 89,
    suggestedHashtags: ['Bitcoin', 'CryptoNews', 'Finance', 'ETFs'],
    imageUrl: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'Golden Bitcoin physical representation sitting over currency ticker data.',
    detectedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
    status: 'pending',
    safetyStatus: {
      isDuplicate: false,
      rateLimitWarning: false,
      riskLevel: 'low',
      riskMessage: 'Safe to post. Well under character limit.'
    }
  },
  {
    id: 'post-draft-1',
    category: 'Business',
    generatedSummary: 'A curated list of productivity habits of high-performing technology founders focusing on asynchronous communication.',
    generatedKeyFacts: [
      'Preferring email/slack over meetings',
      'Blocking deep work focus sessions'
    ],
    headlineVariations: ['Productivity Hacks for Tech Leaders'],
    suggestedPosts: ['Asynchronous communication is the ultimate growth hack. Most meetings could be 1-sentence emails. Build blocks of deep focus, limit distraction channels, and let your team build without constant context-switching.'],
    selectedPostText: 'Asynchronous communication is the ultimate growth hack. Most meetings could be 1-sentence emails. Build blocks of deep focus, limit distraction channels, and let your team build without constant context-switching.',
    similarityScore: 0,
    aiConfidenceScore: 99,
    suggestedHashtags: ['Productivity', 'Leadership', 'BusinessStrategy'],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-keyboard-typing-in-a-dark-office-43093-large.mp4',
    detectedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    status: 'draft',
    safetyStatus: {
      isDuplicate: false,
      rateLimitWarning: false,
      riskLevel: 'low',
      riskMessage: 'Draft looks highly original.'
    }
  },
  {
    id: 'post-scheduled-1',
    sourceId: 'src-wired',
    sourceName: 'Wired News',
    sourceTitle: 'Quantum computing breakthroughs show error mitigation is closer than thought',
    sourceContent: 'Researchers have published new results demonstrating that quantum error mitigation can achieve near-fault-tolerant behavior on noisy, intermediate-scale quantum hardware, drastically shortening the timeline for practical quantum supremacy.',
    sourceUrl: 'https://wired.com/quantum-error-mitigation',
    category: 'Technology',
    generatedSummary: 'New scientific findings in quantum computing error-mitigation show that we can run complex algorithms on imperfect hardware, shortening the roadmap to practical quantum computing.',
    generatedKeyFacts: [
      'Error mitigation speeds up practical quantum usage.',
      'Successfully tested on noisy, intermediate-scale quantum devices.'
    ],
    headlineVariations: ['Quantum Computing Roadmap Drastically Shrinks'],
    suggestedPosts: ['Quantum computing is accelerating. A major breakthrough in error mitigation proves that noisy, imperfect quantum chips can still run highly complex calculations. Commercial quantum supremacy is closer than we thought.'],
    selectedPostText: 'Quantum computing is accelerating. A major breakthrough in error mitigation proves that noisy, imperfect quantum chips can still run highly complex calculations. Commercial quantum supremacy is closer than we thought.',
    similarityScore: 15,
    aiConfidenceScore: 91,
    suggestedHashtags: ['QuantumComputing', 'DeepTech', 'Innovation'],
    detectedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    status: 'scheduled',
    scheduledTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(), // 4 hours from now
    safetyStatus: {
      isDuplicate: false,
      rateLimitWarning: false,
      riskLevel: 'low',
      riskMessage: 'Scheduled successfully. Risk parameters clear.'
    }
  },
  {
    id: 'post-published-1',
    category: 'Technology',
    generatedSummary: 'Discussion on the rise of autonomous AI coding agents in full-stack development.',
    generatedKeyFacts: [],
    headlineVariations: [],
    suggestedPosts: [],
    selectedPostText: 'Autonomous AI coding agents are shifting from simple auto-complete to complete full-stack builders. The future of software is collaborative: developers acting as architects, while AI engines execute the boilerplate and boilerplate tests.',
    similarityScore: 0,
    aiConfidenceScore: 98,
    suggestedHashtags: ['SoftwareDevelopment', 'AIAgents', 'TechTrends'],
    detectedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: 'published',
    publishedTime: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
    safetyStatus: {
      isDuplicate: false,
      rateLimitWarning: false,
      riskLevel: 'low',
      riskMessage: 'Published successfully.'
    }
  },
  {
    id: 'post-published-2',
    category: 'Finance',
    generatedSummary: 'An update on global central banks easing interest rates.',
    generatedKeyFacts: [],
    headlineVariations: [],
    suggestedPosts: [],
    selectedPostText: 'Central banks around the globe are starting to ease interest rates as inflation cools back toward target ranges. This transition signals a major shift in macro liquidity, potentially boosting risk assets and venture capital investments.',
    similarityScore: 5,
    aiConfidenceScore: 92,
    suggestedHashtags: ['Finance', 'Economy', 'MacroEconomics', 'Investing'],
    detectedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    status: 'published',
    publishedTime: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 4 * 3600 * 1000).toISOString(),
    safetyStatus: { isDuplicate: false, rateLimitWarning: false, riskLevel: 'low', riskMessage: '' }
  },
  {
    id: 'post-published-3',
    category: 'Cryptocurrency',
    generatedSummary: 'Ethereum layer 2 network activity spikes to all-time highs.',
    generatedKeyFacts: [],
    headlineVariations: [],
    suggestedPosts: [],
    selectedPostText: 'Ethereum Layer 2 scaling networks have seen transaction volumes spike by over 400% this quarter, driven by ultra-low fees from recent blob-space upgrades. The protocol level is scaling exactly as planned.',
    similarityScore: 8,
    aiConfidenceScore: 96,
    suggestedHashtags: ['Ethereum', 'Layer2', 'Crypto', 'Web3'],
    detectedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    status: 'published',
    publishedTime: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 1 * 3600 * 1000).toISOString(),
    safetyStatus: { isDuplicate: false, rateLimitWarning: false, riskLevel: 'low', riskMessage: '' }
  },
  {
    id: 'post-published-4',
    category: 'Entertainment',
    generatedSummary: 'Teaser trailer of highly anticipated sci-fi sequel breaks records.',
    generatedKeyFacts: [],
    headlineVariations: [],
    suggestedPosts: [],
    selectedPostText: 'The official teaser trailer for Dune: Part Three just dropped and broke streaming records with 80M views in its first 12 hours. The demand for epic sci-fi storytelling has never been stronger. Visual masterpieces belong on the big screen.',
    similarityScore: 2,
    aiConfidenceScore: 94,
    suggestedHashtags: ['Dune', 'Movies', 'SciFi', 'Cinema'],
    detectedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    status: 'published',
    publishedTime: new Date(Date.now() - 4 * 24 * 3600 * 1000 + 2 * 3600 * 1000).toISOString(),
    safetyStatus: { isDuplicate: false, rateLimitWarning: false, riskLevel: 'low', riskMessage: '' }
  }
];

const DEFAULT_BETTING_TIPS: BettingTip[] = [
  {
    id: 'tip-1',
    date: new Date().toISOString().split('T')[0],
    fixture: 'Real Madrid vs Real Sociedad',
    league: 'La Liga (Spain)',
    prediction: 'Real Madrid to Win & Over 1.5 Goals',
    odds: 1.58,
    analysis: 'Real Madrid has won 8 of their last 9 home matches at the Santiago Bernabeu, averaging 2.4 goals per game. Real Sociedad is currently struggling with key defensive injuries (including their starting center-back) and has failed to keep a clean sheet in their last 5 away games. Combined with Vinicius Jr. and Mbappe in red-hot form, a home win with at least two goals is highly secure.',
    confidence: 98,
    bookingCode: 'RM83K9W',
    bookingPlatform: 'SportyBet',
    status: 'pending'
  },
  {
    id: 'tip-2',
    date: new Date().toISOString().split('T')[0],
    fixture: 'Manchester City vs Crystal Palace',
    league: 'Premier League (England)',
    prediction: 'Manchester City Handicap (-1) or Over 2.5 Goals',
    odds: 1.45,
    analysis: 'City is chasing the title and cannot afford any slip-ups at home. Crystal Palace has conceded 12 goals in their last 4 away outings. Historically, City dominates possession at home (average 68%) and creates high xG (2.35). Expect an emphatic, comfortable win with plenty of goals from Haaland and De Bruyne.',
    confidence: 96,
    bookingCode: 'MC92P4L',
    bookingPlatform: 'Bet9ja',
    status: 'pending'
  },
  {
    id: 'tip-3',
    date: new Date().toISOString().split('T')[0],
    fixture: 'Bayern Munich vs FC Koln',
    league: 'Bundesliga (Germany)',
    prediction: 'Bayern Munich Individual Team Goals Over 2.5',
    odds: 1.62,
    analysis: 'Bayern Munich leads the Bundesliga in goalscoring metrics, averaging 3.1 goals per game. Koln has the second worst defensive record in the league and has shown heavy vulnerability on set pieces. At Allianz Arena, Bayern is expected to comfortably cross the 3-goal threshold.',
    confidence: 95,
    bookingCode: 'BM44A7Z',
    bookingPlatform: 'SportyBet',
    status: 'pending'
  },
  {
    id: 'tip-4',
    date: new Date().toISOString().split('T')[0],
    fixture: 'Inter Milan vs Monza',
    league: 'Serie A (Italy)',
    prediction: 'Inter Milan Clean Sheet - YES',
    odds: 1.70,
    analysis: 'Inter Milan boasts the strongest defensive block in Italy under Inzaghi, keeping a clean sheet in 65% of their home games this season. Monza has struggled to create meaningful opportunities on the road, with an expected goals (xG) away rating of just 0.72. Expect a tactical defensive masterclass from Inter.',
    confidence: 94,
    bookingCode: 'IM11X8P',
    bookingPlatform: 'SportyBet',
    status: 'pending'
  },
  {
    id: 'tip-5',
    date: new Date().toISOString().split('T')[0],
    fixture: 'PSG vs Nantes',
    league: 'Ligue 1 (France)',
    prediction: 'PSG Over 1.5 Goals in 2nd Half',
    odds: 1.52,
    analysis: 'PSG is known to dominate the later stages of games as opponents tire from chasing the ball. Nantes has conceded 70% of their away goals in the second half of matches. Under Luis Enrique, PSG\'s bench depth is massive, allowing impact players to exploit space late in the game.',
    confidence: 97,
    bookingCode: 'PG55T3C',
    bookingPlatform: 'Bet9ja',
    status: 'pending'
  }
];

const INITIAL_STATE: DBState = {
  sources: DEFAULT_SOURCES,
  posts: DEFAULT_POSTS,
  bettingTips: DEFAULT_BETTING_TIPS,
  xConfig: {
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    accessSecret: '',
    isConnected: false,
    xHandle: '@AIPressRoom'
  },
  instagramConfig: {
    accessToken: '',
    businessAccountId: '',
    isConnected: false,
    instagramHandle: '@AISportsHub'
  }
};

let cachedState: DBState = INITIAL_STATE;
let isInitialized = false;

let dbStatus = {
  isConfigured: false,
  isConnected: false,
  error: null as string | null,
  firebaseUrl: null as string | null
};

export function getDBStatus() {
  return dbStatus;
}

function getLocalDB(): DBState {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_STATE, null, 2), 'utf-8');
      return INITIAL_STATE;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.sources || !parsed.posts) {
      return INITIAL_STATE;
    }
    if (!parsed.xConfig) {
      parsed.xConfig = { apiKey: '', apiSecret: '', accessToken: '', accessSecret: '', isConnected: false, xHandle: '@AIPressRoom' };
    } else if (!parsed.xConfig.xHandle) {
      parsed.xConfig.xHandle = '@AIPressRoom';
    }
    if (!parsed.instagramConfig) {
      parsed.instagramConfig = { accessToken: '', businessAccountId: '', isConnected: false, instagramHandle: '@AISportsHub' };
    }
    if (!parsed.bettingTips) {
      parsed.bettingTips = DEFAULT_BETTING_TIPS;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading local DB:', err);
    return INITIAL_STATE;
  }
}

let dbRef: any = null;

async function initDBREST(dbUrl: string): Promise<void> {
  const normalizedUrl = `${dbUrl.replace(/\/$/, '')}/db.json`;
  const secret = process.env.FIREBASE_DATABASE_SECRET;
  const requestUrl = secret ? `${normalizedUrl}?auth=${secret}` : normalizedUrl;

  console.log(`Connecting and initializing database via REST API: ${dbUrl}`);
  const res = await fetch(requestUrl);
  if (res.ok) {
    const data = await res.json();
    if (data && typeof data === 'object') {
      if (!data.sources) data.sources = DEFAULT_SOURCES;
      if (!data.posts) data.posts = DEFAULT_POSTS;
      if (!data.bettingTips) data.bettingTips = DEFAULT_BETTING_TIPS;
      if (!data.xConfig) {
        data.xConfig = { apiKey: '', apiSecret: '', accessToken: '', accessSecret: '', isConnected: false, xHandle: '@AIPressRoom' };
      } else if (!data.xConfig.xHandle) {
        data.xConfig.xHandle = '@AIPressRoom';
      }
      if (!data.instagramConfig) {
        data.instagramConfig = { accessToken: '', businessAccountId: '', isConnected: false, instagramHandle: '@AISportsHub' };
      }
      cachedState = data as DBState;
      console.log('Successfully synchronized cache with Firebase Realtime Database via REST.');
    } else {
      console.log('Firebase Realtime Database is currently empty. Seeding INITIAL_STATE...');
      cachedState = INITIAL_STATE;
      await saveDBToFirebase(INITIAL_STATE);
    }
    dbStatus.isConnected = true;
    dbStatus.error = null;
  } else {
    let statusText = `Status ${res.status}`;
    if (res.status === 401) {
      const saSecret = process.env.FIREBASE_DATABASE_SECRET || '';
      const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT || '';
      if (saSecret.includes('BEGIN PRIVATE KEY') || saEnv.includes('BEGIN PRIVATE KEY')) {
        statusText = `Status 401: Unauthorized. Raw PEM Private Key detected in environment. You have pasted the raw Private Key instead of the full Service Account JSON object. Please paste the ENTIRE downloaded service account JSON file (which contains 'private_key', 'client_email', 'project_id', etc.) into your FIREBASE_SERVICE_ACCOUNT environment variable.`;
      } else {
        statusText = `Status 401: Unauthorized. Please verify your FIREBASE_DATABASE_SECRET matches your database rules, or set up a valid service account in FIREBASE_SERVICE_ACCOUNT.`;
      }
    }
    console.error(`Firebase Realtime Database connection returned status ${res.status}. Falling back to local db.json.`);
    dbStatus.error = statusText;
    cachedState = getLocalDB();
  }
}

function parseServiceAccount(val: string): any {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  
  // If it's a placeholder like "-" or "none", skip it
  if (trimmed === '-' || trimmed === 'none' || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }

  // Check if it's a raw private key PEM string instead of JSON
  if (trimmed.startsWith('-----BEGIN PRIVATE KEY-----')) {
    throw new Error("Value is a raw RSA Private Key PEM string, not a JSON service account object. You must paste the ENTIRE JSON content of your downloaded service account key file (containing 'private_key', 'client_email', 'project_id', etc.) into FIREBASE_SERVICE_ACCOUNT.");
  }

  let parsed: any = null;
  // Try parsing directly first
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    // If that fails, try to extract JSON from the string
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = trimmed.substring(firstBrace, lastBrace + 1);
      try {
        parsed = JSON.parse(candidate);
      } catch (innerError) {
        // Fall through
      }
    }
    if (!parsed) throw e; // throw original error if both failed
  }

  // Ensure private key is properly formatted with actual newlines
  if (parsed && typeof parsed === 'object' && parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }

  return parsed;
}

export async function initDB(): Promise<void> {
  const dbUrl = process.env.FIREBASE_DATABASE_URL;
  dbStatus.firebaseUrl = dbUrl || null;
  dbStatus.isConfigured = !!dbUrl;

  if (!dbUrl) {
    console.log('Firebase Database URL not set. Initializing with local db.json.');
    cachedState = getLocalDB();
    isInitialized = true;
    return;
  }

  try {
    let credential: any = null;

    // 1. Check for FIREBASE_SERVICE_ACCOUNT env variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
        if (sa) {
          credential = cert(sa);
          console.log('Using Firebase Service Account from environment variable.');
        }
      } catch (e: any) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:', e);
        dbStatus.error = e.message;
      }
    }

    // 2. Check for local serviceAccountKey.json file
    if (!credential) {
      const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(keyPath)) {
        try {
          const fileContent = fs.readFileSync(keyPath, 'utf-8');
          const sa = JSON.parse(fileContent);
          credential = cert(sa);
          console.log('Using Firebase Service Account from local serviceAccountKey.json file.');
        } catch (e: any) {
          console.error('Failed to parse local serviceAccountKey.json file:', e);
        }
      }
    }

    // If no service account credential found, fall back to legacy REST method
    if (!credential) {
      console.log('No service account credential found. Falling back to public REST/fetch connection.');
      await initDBREST(dbUrl);
      isInitialized = true;
      return;
    }

    console.log(`Connecting and initializing database from Firebase Realtime Database via Admin SDK: ${dbUrl}`);
    
    // Initialize Admin SDK App if not already initialized
    if (getApps().length === 0) {
      initializeApp({
        credential,
        databaseURL: dbUrl
      });
    }

    const db = getDatabase();
    dbRef = db.ref('db'); // We store our DB state under the root 'db' node

    const snapshot = await dbRef.once('value');
    const data = snapshot.val();

    if (data && typeof data === 'object') {
      if (!data.sources) data.sources = DEFAULT_SOURCES;
      if (!data.posts) data.posts = DEFAULT_POSTS;
      if (!data.bettingTips) data.bettingTips = DEFAULT_BETTING_TIPS;
      if (!data.xConfig) {
        data.xConfig = { apiKey: '', apiSecret: '', accessToken: '', accessSecret: '', isConnected: false, xHandle: '@AIPressRoom' };
      } else if (!data.xConfig.xHandle) {
        data.xConfig.xHandle = '@AIPressRoom';
      }
      if (!data.instagramConfig) {
        data.instagramConfig = { accessToken: '', businessAccountId: '', isConnected: false, instagramHandle: '@AISportsHub' };
      }
      cachedState = data as DBState;
      console.log('Successfully synchronized cache with Firebase Realtime Database (via Admin SDK).');
    } else {
      console.log('Firebase Realtime Database "db" node is empty. Seeding INITIAL_STATE...');
      cachedState = INITIAL_STATE;
      await dbRef.set(INITIAL_STATE);
    }
    dbStatus.isConnected = true;
    dbStatus.error = null;
  } catch (error: any) {
    console.error('Failed to connect to Firebase Realtime Database via Admin SDK:', error);
    dbStatus.error = error.message || String(error);
    console.log('Falling back to local db.json.');
    cachedState = getLocalDB();
  }
  isInitialized = true;
}

async function saveDBToFirebase(state: DBState): Promise<void> {
  const sanitizedState = sanitizeForFirebase(state);
  if (dbRef) {
    try {
      await dbRef.set(sanitizedState);
      console.log('Database successfully saved to Firebase Realtime Database using Admin SDK.');
      return;
    } catch (err: any) {
      console.error('Failed to save to Firebase Realtime Database via Admin SDK, falling back to REST:', err);
    }
  }

  const dbUrl = process.env.FIREBASE_DATABASE_URL;
  if (!dbUrl) return;

  const normalizedUrl = `${dbUrl.replace(/\/$/, '')}/db.json`;
  const secret = process.env.FIREBASE_DATABASE_SECRET;
  const requestUrl = secret ? `${normalizedUrl}?auth=${secret}` : normalizedUrl;

  try {
    const res = await fetch(requestUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedState)
    });
    if (!res.ok) {
      console.error(`Failed to write to Firebase via REST: ${res.statusText}`);
    }
  } catch (err) {
    console.error('Error writing database to Firebase via REST:', err);
  }
}

export function getDB(): DBState {
  if (!isInitialized) {
    return getLocalDB();
  }
  return cachedState;
}

export async function saveDB(state: DBState): Promise<void> {
  cachedState = state;
  
  // Save locally
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local DB file:', err);
  }

  // Save to Firebase
  const dbUrl = process.env.FIREBASE_DATABASE_URL;
  if (dbUrl) {
    try {
      await saveDBToFirebase(state);
      console.log('Firebase Realtime Database synchronized.');
    } catch (err) {
      console.error('Firebase write failed:', err);
    }
  }
}

export function getSources(): Source[] {
  return getDB().sources;
}

export async function addSource(source: Omit<Source, 'id' | 'addedAt'>): Promise<Source> {
  const db = getDB();
  const newSource: Source = {
    ...source,
    id: `src-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    addedAt: new Date().toISOString()
  };
  db.sources.push(newSource);
  await saveDB(db);
  return newSource;
}

export async function deleteSource(id: string): Promise<void> {
  const db = getDB();
  db.sources = db.sources.filter(s => s.id !== id);
  await saveDB(db);
}

export function getPosts(): Post[] {
  return getDB().posts;
}

export async function addPost(post: Omit<Post, 'id' | 'detectedAt'>): Promise<Post> {
  const db = getDB();
  const newPost: Post = {
    ...post,
    id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    detectedAt: new Date().toISOString()
  };
  db.posts.push(newPost);
  await saveDB(db);
  return newPost;
}

export async function updatePost(updatedPost: Post): Promise<void> {
  const db = getDB();
  db.posts = db.posts.map(p => p.id === updatedPost.id ? updatedPost : p);
  await saveDB(db);
}

export async function deletePost(id: string): Promise<void> {
  const db = getDB();
  db.posts = db.posts.filter(p => p.id !== id);
  await saveDB(db);
}

export function getXConfig() {
  return getDB().xConfig;
}

export async function saveXConfig(config: DBState['xConfig']): Promise<void> {
  const db = getDB();
  db.xConfig = config;
  await saveDB(db);
}

export function getInstagramConfig() {
  return getDB().instagramConfig || { accessToken: '', businessAccountId: '', isConnected: false, instagramHandle: '@AISportsHub' };
}

export async function saveInstagramConfig(config: DBState['instagramConfig']): Promise<void> {
  const db = getDB();
  db.instagramConfig = config;
  await saveDB(db);
}

export function getBettingTips(): BettingTip[] {
  return getDB().bettingTips || DEFAULT_BETTING_TIPS;
}

export async function saveBettingTips(tips: BettingTip[]): Promise<void> {
  const db = getDB();
  db.bettingTips = tips;
  await saveDB(db);
}

export async function addBettingTip(tip: Omit<BettingTip, 'id'>): Promise<BettingTip> {
  const db = getDB();
  const newTip: BettingTip = {
    ...tip,
    id: `tip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
  };
  if (!db.bettingTips) {
    db.bettingTips = [];
  }
  db.bettingTips.push(newTip);
  await saveDB(db);
  return newTip;
}

export async function updateBettingTip(updatedTip: BettingTip): Promise<void> {
  const db = getDB();
  if (db.bettingTips) {
    db.bettingTips = db.bettingTips.map(t => t.id === updatedTip.id ? updatedTip : t);
    await saveDB(db);
  }
}

