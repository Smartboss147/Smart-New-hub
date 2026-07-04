import fs from 'fs';
import path from 'path';
import { Source, Post } from '../types.js';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

// Make sure parent folder exists
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

interface DBState {
  sources: Source[];
  posts: Post[];
  xConfig: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
    isConnected: boolean;
    xHandle?: string;
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

const INITIAL_STATE: DBState = {
  sources: DEFAULT_SOURCES,
  posts: DEFAULT_POSTS,
  xConfig: {
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    accessSecret: '',
    isConnected: false,
    xHandle: '@AIPressRoom'
  }
};

export function getDB(): DBState {
  try {
    if (!fs.existsSync(DB_FILE)) {
      saveDB(INITIAL_STATE);
      return INITIAL_STATE;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    // Ensure structure is correct
    if (!parsed.sources || !parsed.posts) {
      saveDB(INITIAL_STATE);
      return INITIAL_STATE;
    }
    // Backward compatibility for xHandle
    if (!parsed.xConfig) {
      parsed.xConfig = { apiKey: '', apiSecret: '', accessToken: '', accessSecret: '', isConnected: false, xHandle: '@AIPressRoom' };
    } else if (!parsed.xConfig.xHandle) {
      parsed.xConfig.xHandle = '@AIPressRoom';
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB, returning default:', err);
    return INITIAL_STATE;
  }
}

export function saveDB(state: DBState): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

export function getSources(): Source[] {
  return getDB().sources;
}

export function addSource(source: Omit<Source, 'id' | 'addedAt'>): Source {
  const db = getDB();
  const newSource: Source = {
    ...source,
    id: `src-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    addedAt: new Date().toISOString()
  };
  db.sources.push(newSource);
  saveDB(db);
  return newSource;
}

export function deleteSource(id: string): void {
  const db = getDB();
  db.sources = db.sources.filter(s => s.id !== id);
  saveDB(db);
}

export function getPosts(): Post[] {
  return getDB().posts;
}

export function addPost(post: Omit<Post, 'id' | 'detectedAt'>): Post {
  const db = getDB();
  const newPost: Post = {
    ...post,
    id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    detectedAt: new Date().toISOString()
  };
  db.posts.push(newPost);
  saveDB(db);
  return newPost;
}

export function updatePost(updatedPost: Post): void {
  const db = getDB();
  db.posts = db.posts.map(p => p.id === updatedPost.id ? updatedPost : p);
  saveDB(db);
}

export function deletePost(id: string): void {
  const db = getDB();
  db.posts = db.posts.filter(p => p.id !== id);
  saveDB(db);
}

export function getXConfig() {
  return getDB().xConfig;
}

export function saveXConfig(config: DBState['xConfig']): void {
  const db = getDB();
  db.xConfig = config;
  saveDB(db);
}
