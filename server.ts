import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import Parser from 'rss-parser';
import {
  getSources,
  addSource,
  deleteSource,
  getPosts,
  addPost,
  updatePost,
  deletePost,
  getXConfig,
  saveXConfig
} from './src/server/db.js';
import { calculateSimilarity, evaluatePostSafety } from './src/utils.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const rssParser = new Parser();

// -----------------------------------------------------------------------------
// ENDPOINTS
// -----------------------------------------------------------------------------

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Sources Endpoints
app.get('/api/sources', (req, res) => {
  try {
    const sources = getSources();
    res.json(sources);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sources', (req, res) => {
  try {
    const { name, type, url, category } = req.body;
    if (!name || !type || !url || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const source = addSource({ name, type, url, category, isActive: true });
    res.status(201).json(source);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sources/:id', (req, res) => {
  try {
    deleteSource(req.params.id);
    res.json({ message: 'Source deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Posts Endpoints
app.get('/api/posts', (req, res) => {
  try {
    const posts = getPosts();
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manual Post Creation / Drafts
app.post('/api/posts', (req, res) => {
  try {
    const {
      sourceName,
      sourceTitle,
      sourceContent,
      category,
      selectedPostText,
      status,
      scheduledTime,
      imageUrl,
      imageCaption,
      videoUrl,
      targetXHandle
    } = req.body;

    if (!selectedPostText || !category) {
      return res.status(400).json({ error: 'Post text and category are required' });
    }

    const allPosts = getPosts();
    const existingTexts = allPosts.map(p => p.selectedPostText);
    const safety = evaluatePostSafety(selectedPostText, existingTexts);

    const textToCompare = sourceContent || sourceTitle || '';
    const similarity = calculateSimilarity(selectedPostText, textToCompare);

    const post = addPost({
      sourceName: sourceName || 'Manual Entry',
      sourceTitle: sourceTitle || 'Manual Draft',
      sourceContent: sourceContent || '',
      category,
      generatedSummary: sourceContent ? (sourceContent.substring(0, 100) + '...') : 'Manually written post',
      generatedKeyFacts: [],
      headlineVariations: [],
      suggestedPosts: [selectedPostText],
      selectedPostText,
      similarityScore: similarity,
      aiConfidenceScore: 100,
      suggestedHashtags: selectedPostText.match(/#[a-zA-Z0-9_]+/g)?.map(h => h.replace('#', '')) || [],
      status: status || 'draft',
      scheduledTime,
      safetyStatus: safety,
      publishedTime: status === 'published' ? new Date().toISOString() : undefined,
      imageUrl,
      imageCaption,
      videoUrl,
      targetXHandle: targetXHandle || getXConfig()?.xHandle || '@AIPressRoom'
    });

    res.status(201).json(post);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Post (Approve, Edit, Reject, Schedule)
app.put('/api/posts/:id', (req, res) => {
  try {
    const id = req.params.id;
    const posts = getPosts();
    const existingPost = posts.find(p => p.id === id);

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const updated = { ...existingPost, ...req.body };

    // If text was modified, re-evaluate similarity and safety checks
    if (req.body.selectedPostText && req.body.selectedPostText !== existingPost.selectedPostText) {
      const otherPosts = posts.filter(p => p.id !== id).map(p => p.selectedPostText);
      updated.safetyStatus = evaluatePostSafety(req.body.selectedPostText, otherPosts);

      const textToCompare = updated.sourceContent || updated.sourceTitle || '';
      updated.similarityScore = calculateSimilarity(req.body.selectedPostText, textToCompare);
    }

    // Set published timestamp if status is updated to published
    if (req.body.status === 'published' && existingPost.status !== 'published') {
      updated.publishedTime = new Date().toISOString();
    }

    updatePost(updated);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/posts/:id', (req, res) => {
  try {
    deletePost(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// X Config Settings
app.get('/api/x-config', (req, res) => {
  try {
    res.json(getXConfig());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/x-config', (req, res) => {
  try {
    const { apiKey, apiSecret, accessToken, accessSecret, xHandle } = req.body;
    const isConnected = !!(apiKey && apiSecret && accessToken && accessSecret);
    saveXConfig({ apiKey, apiSecret, accessToken, accessSecret, isConnected, xHandle });
    res.json({ message: 'X configuration updated', isConnected });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Expansion Endpoint for Manual Composer
app.post('/api/ai/expand', async (req, res) => {
  try {
    const { prompt, category } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const aiPrompt = `
      Category: ${category || 'General'}
      Rough concept/idea: "${prompt}"

      Please expand this into a single, high-engagement X (Twitter) post.
      Rules:
      - Max 280 characters.
      - Make it sound human, highly engaging, natural, and friendly or thought-provoking.
      - Add exactly 2 relevant hashtags at the end.
      - Do NOT use robotic or overly promotional language.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: aiPrompt,
      config: {
        systemInstruction: "You are an elite Twitter ghostwriter who drafts viral, high-value, and authentic tweets. You write in simple, direct, human-centric language.",
      }
    });

    res.json({ expandedText: response.text.trim() });
  } catch (error: any) {
    console.error('Expand thought error:', error);
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// AI GENERATION LOGIC WITH GEMINI API
// -----------------------------------------------------------------------------

// Post Regeneration Endpoint (Triggered when clicking "Regenerate" on post)
app.post('/api/posts/:id/regenerate', async (req, res) => {
  try {
    const { id } = req.params;
    const { instructions } = req.body;
    const posts = getPosts();
    const post = posts.find(p => p.id === id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const prompt = `
      Original Content / Article text:
      "${post.sourceContent || post.sourceTitle || post.selectedPostText}"

      Rewrite request: ${instructions || 'Provide a fresh, highly original, highly engaging set of variations. Ensure strict compliance to the 280 character limit per post, avoid copyright infringement, and use a professional but friendly tone.'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are an elite AI Content Writer and Social Media Strategist. Your mission is to take source news or articles, extract critical insights, and draft original X (Twitter) posts.
        CRITICAL RULES:
        - NEVER copy whole sentences or major word structures from the source.
        - Ensure output does not exceed 280 characters.
        - Adopt an active, engaging, thought-leading, or friendly tone appropriate for Twitter.
        - Suggest 4 relevant, unbranded, high-traffic hashtags.
        `,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            suggestedPosts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedHashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['summary', 'suggestedPosts', 'suggestedHashtags']
        }
      }
    });

    const data = JSON.parse(response.text.trim());

    // Update the post state
    post.generatedSummary = data.summary;
    post.suggestedPosts = data.suggestedPosts;
    post.suggestedHashtags = data.suggestedHashtags;
    post.selectedPostText = data.suggestedPosts[0] || post.selectedPostText;

    // Recalculate similarity and safety
    const textToCompare = post.sourceContent || post.sourceTitle || '';
    post.similarityScore = calculateSimilarity(post.selectedPostText, textToCompare);
    
    const otherPosts = posts.filter(p => p.id !== id).map(p => p.selectedPostText);
    post.safetyStatus = evaluatePostSafety(post.selectedPostText, otherPosts);

    updatePost(post);
    res.json(post);
  } catch (error: any) {
    console.error('Gemini regeneration error:', error);
    res.status(500).json({ error: `AI Regeneration failed: ${error.message}` });
  }
});

// FEED MONITORING & SIMULATION ENDPOINT
// Fetches latest RSS feeds and uses Gemini to generate rewrites into 'pending' posts
app.post('/api/sources/monitor', async (req, res) => {
  try {
    const sources = getSources().filter(s => s.isActive && s.type === 'rss_feed');
    let fetchedCount = 0;
    let newPostsGenerated = 0;

    const currentPosts = getPosts();
    const existingTitles = new Set(currentPosts.map(p => p.sourceTitle?.toLowerCase().trim()));
    const existingUrls = new Set(currentPosts.map(p => p.sourceUrl?.toLowerCase().trim()));

    // Define some fallback trending articles in case external feed fetch is slow, rate-limited, or blocked by CORS
    const fallbackArticles = [
      {
        sourceId: 'src-wired',
        sourceName: 'Wired News',
        category: 'Technology',
        title: 'Tech Giants Unveil Alliance For Secure Decentralized Artificial Intelligence Models',
        content: 'A massive consortium of global hardware and software creators have finalized a cooperative alliance aimed at providing standard security boundaries, shared computing pools, and decentralized governance frameworks for next-generation generative models.',
        link: 'https://www.wired.com/decentralized-ai-standards'
      },
      {
        sourceId: 'src-techcrunch-ai',
        sourceName: 'TechCrunch AI',
        category: 'Technology',
        title: 'Global Tech Consortium Announces Open Standards for Decentralized AI Models',
        content: 'Major technology platforms and custom hardware designers have announced an open alliance to establish shared benchmarks, secure hosting zones, and standardized decentralized governance for high-performance AI models.',
        link: 'https://techcrunch.com/decentralized-ai-standards-alliance'
      },
      {
        sourceId: 'src-coindesk',
        sourceName: 'CoinDesk Crypto',
        category: 'Cryptocurrency',
        title: 'Global Regulatory Committee Agrees on Unified Bank Reserve Guidelines for Stablecoins',
        content: 'Regulators spanning three continents have released a comprehensive blueprint mandating stablecoin networks to back 100% of outstanding circulation in secure treasury bonds, while providing immediate, auditable transparency reports on a bi-weekly cycle.',
        link: 'https://www.coindesk.com/global-stablecoin-regulation-rules'
      },
      {
        sourceId: 'src-techcrunch',
        sourceName: 'TechCrunch',
        category: 'Business',
        title: 'Venture Backing Shifts Rapidly Towards Hardware Acceleration and Silicon Startups',
        content: 'Quarterly transaction logs show venture capital allocations for semiconductor, custom server board, and physical networking hardware startups spiked by 120% this fiscal year, as general SaaS funding settles into historical averages.',
        link: 'https://techcrunch.com/silicon-hardware-funding-spikes'
      }
    ];

    // Try fetching from real feeds first
    const itemsToProcess: any[] = [];

    for (const src of sources) {
      try {
        // Limit real fetches to prevent blocking
        console.log(`Fetching feed: ${src.url}`);
        const feed = await rssParser.parseURL(src.url);
        fetchedCount++;
        
        const latestItems = feed.items.slice(0, 3); // Get latest 3
        for (const item of latestItems) {
          const title = item.title || '';
          const url = item.link || '';
          
          if (title && !existingTitles.has(title.toLowerCase().trim()) && !existingUrls.has(url.toLowerCase().trim())) {
            itemsToProcess.push({
              sourceId: src.id,
              sourceName: src.name,
              category: src.category,
              title: title,
              content: item.contentSnippet || item.content || title,
              link: url
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching feed ${src.name}:`, err);
      }
    }

    // If no new real feed items were detected, or we are offline/throttled, inject fallback articles to demonstrate the dynamic AI rewriting live!
    if (itemsToProcess.length === 0) {
      // Find fallback articles that we haven't processed yet
      const unprocessedFallbacks = fallbackArticles.filter(
        art => !existingTitles.has(art.title.toLowerCase().trim()) && !existingUrls.has(art.link.toLowerCase().trim())
      );
      
      if (unprocessedFallbacks.length > 0) {
        // If our two related AI/Tech articles are unprocessed, push both of them to trigger a Trend Alert
        const hasWired = unprocessedFallbacks.some(f => f.sourceId === 'src-wired');
        const hasTCAI = unprocessedFallbacks.some(f => f.sourceId === 'src-techcrunch-ai');
        
        if (hasWired && hasTCAI) {
          itemsToProcess.push(
            unprocessedFallbacks.find(f => f.sourceId === 'src-wired'),
            unprocessedFallbacks.find(f => f.sourceId === 'src-techcrunch-ai')
          );
        } else {
          // Just take up to 2 unprocessed ones
          itemsToProcess.push(...unprocessedFallbacks.slice(0, 2));
        }
      }
    }

    // Process detected items with Gemini API
    for (const item of itemsToProcess.slice(0, 2)) { // Cap at 2 per run to maintain speed
      try {
        const prompt = `
          New Article Content:
          Title: ${item.title}
          Body/Description: ${item.content}
          Category: ${item.category}

          Your goal is to extract the facts, rewrite them to avoid plagiarism, and draft social media copies.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: `You are an advanced social media manager and SEO editor.
            Review the input news article. You MUST generate:
            1. An original rewritten summary in simple English.
            2. A list of 3 separate factual bullet points (facts).
            3. 3 headline options.
            4. 3 distinct Twitter/X posts under 280 characters.
               - Ensure posts sound extremely natural, engaging, and professional.
               - Vary the style of the 3 posts (e.g., Post 1: Question & Hook, Post 2: Direct Stat/Statement, Post 3: Insightful Take).
               - Avoid copying identical word sequences or idioms from the source text.
            5. 4 relevant, clean hashtags (without the # character).
            6. A confidence rating (80-100) based on how clearly you parsed the source content.
            `,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                keyFacts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                headlineVariations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                suggestedPosts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                suggestedHashtags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                aiConfidenceScore: { type: Type.INTEGER }
              },
              required: ['summary', 'keyFacts', 'headlineVariations', 'suggestedPosts', 'suggestedHashtags', 'aiConfidenceScore']
            }
          }
        });

        const data = JSON.parse(response.text.trim());
        const selectedPostText = data.suggestedPosts[0] || 'No post text generated';
        
        // Calculate similarity and evaluate safety
        const similarity = calculateSimilarity(selectedPostText, item.content || item.title);
        const otherPosts = currentPosts.map(p => p.selectedPostText);
        const safety = evaluatePostSafety(selectedPostText, otherPosts);

        addPost({
          sourceId: item.sourceId,
          sourceName: item.sourceName,
          sourceTitle: item.title,
          sourceContent: item.content,
          sourceUrl: item.link,
          category: item.category,
          generatedSummary: data.summary,
          generatedKeyFacts: data.keyFacts,
          headlineVariations: data.headlineVariations,
          suggestedPosts: data.suggestedPosts,
          selectedPostText,
          similarityScore: similarity,
          aiConfidenceScore: data.aiConfidenceScore,
          suggestedHashtags: data.suggestedHashtags,
          status: 'pending',
          safetyStatus: safety,
          targetXHandle: getXConfig()?.xHandle || '@AIPressRoom'
        });

        newPostsGenerated++;
      } catch (geminiErr) {
        console.error(`Error running Gemini rewrite on item "${item.title}":`, geminiErr);
      }
    }

    // -------------------------------------------------------------------------
    // TREND ALERT SIMILARITY DETECTION LOGIC
    // -------------------------------------------------------------------------
    const detectedTrends: any[] = [];
    const processedPairs = new Set<string>();

    // Take recent posts (last 15 items) from database for cross-check
    const recentDbPosts = currentPosts.slice(0, 15);

    // Evaluator helper
    const checkAndAddTrend = (
      titleA: string, contentA: string, srcIdA: string, srcNameA: string, urlA: string, catA: string,
      titleB: string, contentB: string, srcIdB: string, srcNameB: string, urlB: string, catB: string
    ) => {
      if (!titleA || !titleB) return;
      if (srcIdA === srcIdB) return; // Ignore if from the exact same source
      
      const sim = calculateSimilarity(titleA + " " + contentA, titleB + " " + contentB);
      if (sim >= 12) { // 12% is a reliable threshold for filtered words overlap
        const pairKey = [srcIdA, srcIdB].sort().join('-');
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          detectedTrends.push({
            topic: titleA.length < titleB.length ? titleA : titleB,
            category: catA || catB || 'Breaking News',
            similarityScore: sim,
            sources: [srcNameA, srcNameB],
            articles: [
              { title: titleA, source: srcNameA, link: urlA },
              { title: titleB, source: srcNameB, link: urlB }
            ],
            detectedAt: new Date().toISOString()
          });
        }
      }
    };

    // 1. Check newly processed items against each other
    for (let i = 0; i < itemsToProcess.length; i++) {
      for (let j = i + 1; j < itemsToProcess.length; j++) {
        const itemA = itemsToProcess[i];
        const itemB = itemsToProcess[j];
        checkAndAddTrend(
          itemA.title, itemA.content, itemA.sourceId, itemA.sourceName, itemA.link, itemA.category,
          itemB.title, itemB.content, itemB.sourceId, itemB.sourceName, itemB.link, itemB.category
        );
      }
    }

    // 2. Check newly processed items against recent database posts
    for (const item of itemsToProcess) {
      for (const post of recentDbPosts) {
        checkAndAddTrend(
          item.title, item.content, item.sourceId, item.sourceName, item.link, item.category,
          post.sourceTitle || '', post.sourceContent || '', post.sourceId || 'db-source', post.sourceName || 'Unknown Source', post.sourceUrl || '', post.category
        );
      }
    }

    res.json({
      success: true,
      feedsMonitored: sources.length,
      feedsSuccessfullyFetched: fetchedCount,
      newArticlesProcessed: itemsToProcess.length,
      newPendingPostsCreated: newPostsGenerated,
      trendAlert: detectedTrends.length > 0 ? detectedTrends[0] : null
    });
  } catch (error: any) {
    console.error('Monitor feeds error:', error);
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// VITE DEV SERVER MIDDLEWARE & STATIC SERVING IN PRODUCTION
// -----------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Running server with Vite development middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Running server in production mode, serving built assets.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
