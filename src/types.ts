export type SourceType = 'x_account' | 'rss_feed' | 'news_site' | 'blog' | 'instagram_handle';

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  category: string;
  isActive: boolean;
  addedAt: string;
}

export type PostStatus = 'pending' | 'draft' | 'scheduled' | 'published' | 'rejected';

export interface SafetyStatus {
  isDuplicate: boolean;
  rateLimitWarning: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  riskMessage: string;
}

export interface Post {
  id: string;
  sourceId?: string;
  sourceName?: string;
  sourceTitle?: string;
  sourceContent?: string;
  sourceUrl?: string;
  category: string;
  generatedSummary: string;
  generatedKeyFacts: string[];
  headlineVariations: string[];
  suggestedPosts: string[];
  selectedPostText: string;
  similarityScore: number;
  aiConfidenceScore: number;
  suggestedHashtags: string[];
  imageUrl?: string;
  imageCaption?: string;
  videoUrl?: string;
  detectedAt: string;
  status: PostStatus;
  scheduledTime?: string;
  publishedTime?: string;
  safetyStatus?: SafetyStatus;
  targetXHandle?: string;
}

export interface AppState {
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
