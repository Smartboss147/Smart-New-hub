export const CATEGORIES = [
  'Breaking News',
  'Technology',
  'Business',
  'Cryptocurrency',
  'Finance',
  'Sports',
  'Gaming',
  'Entertainment',
  'Music',
  'Movies',
  'Politics',
  'Health',
  'Lifestyle'
];

/**
 * Calculates Jaccard similarity (word overlap ratio) between two strings.
 * Filters out basic stop words to focus on content-carrying words.
 */
export function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  const stopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down',
    'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent',
    'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him', 'himself',
    'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its',
    'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off',
    'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than',
    'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these',
    'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under',
    'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats',
    'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with',
    'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve', 'your', 'yours', 'yourself',
    'yourselves'
  ]);

  const tokenize = (str: string): string[] => {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.has(word));
  };

  const words1 = new Set(tokenize(text1));
  const words2 = new Set(tokenize(text2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersectionCount = 0;
  for (const w of words1) {
    if (words2.has(w)) {
      intersectionCount++;
    }
  }

  const unionSize = words1.size + words2.size - intersectionCount;
  return Math.round((intersectionCount / unionSize) * 100);
}

/**
 * Checks safety parameters for a post text.
 */
export function evaluatePostSafety(text: string, existingPosts: string[]): {
  isDuplicate: boolean;
  rateLimitWarning: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  riskMessage: string;
} {
  const isDuplicate = existingPosts.some(p => p.toLowerCase().trim() === text.toLowerCase().trim());
  const length = text.length;
  
  // Rate limit check simulation
  const rateLimitWarning = false; // Evaluated dynamically at runtime based on interval

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let riskMessage = 'Safe to post. Highly original and natural tone.';

  if (length > 280) {
    riskLevel = 'high';
    riskMessage = 'Exceeds standard X (Twitter) character limit of 280 characters.';
  } else if (isDuplicate) {
    riskLevel = 'high';
    riskMessage = 'Duplicate content! This identical text was already published. Highly risky for account suspension.';
  } else {
    // Check hashtag counts (best practice is <= 3 hashtags to avoid spam detection)
    const hashtags = (text.match(/#[a-zA-Z0-9_]+/g) || []).length;
    if (hashtags > 3) {
      riskLevel = 'medium';
      riskMessage = 'Too many hashtags (more than 3). This may be flagged as spam by the X algorithm.';
    } else if (/(cryptocurrency|crypto|btc|eth|sol|giveaway|airdrop|binance)/i.test(text) && text.includes('http')) {
      riskLevel = 'medium';
      riskMessage = 'Post contains crypto keywords and links. It might be flagged under promotional guidelines.';
    }
  }

  return { isDuplicate, rateLimitWarning, riskLevel, riskMessage };
}

/**
 * Recursively removes or converts undefined values to null for Firebase compatibility.
 */
export function sanitizeForFirebase(obj: any): any {
  if (obj === undefined) {
    return null;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirebase);
  }
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeForFirebase(value);
    }
  }
  return sanitized;
}
