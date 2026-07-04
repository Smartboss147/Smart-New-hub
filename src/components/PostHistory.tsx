import { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  ThumbsUp,
  Share2,
  BarChart,
  Eye,
  CheckCircle,
  HelpCircle,
  Twitter
} from 'lucide-react';
import { Post } from '../types.js';
import { CATEGORIES } from '../utils.js';

interface PostHistoryProps {
  posts: Post[];
  onDeletePost: (id: string) => Promise<void>;
}

export default function PostHistory({ posts, onDeletePost }: PostHistoryProps) {
  const publishedPosts = posts.filter(p => p.status === 'published');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter list
  const filteredPosts = publishedPosts.filter(p => {
    const matchesSearch = p.selectedPostText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this post from your history logs? (This does not affect your live X feed)')) {
      await onDeletePost(id);
    }
  };

  // Generate deterministic mock engagement numbers for rendering
  const getEngagementMetrics = (post: Post) => {
    // Generate some numbers based on characters and text hash
    const sum = post.selectedPostText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const impressions = 450 + (sum % 1200);
    const likes = Math.round(impressions * (0.05 + (sum % 10) / 100));
    const reposts = Math.round(likes * (0.15 + (sum % 5) / 100));
    const clicks = Math.round(impressions * (0.02 + (sum % 4) / 100));

    return { impressions, likes, reposts, clicks };
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-950/20 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Post History</h1>
          <p className="text-xs text-slate-400">Review all published content, monitor public engagement stats, and manage social archives.</p>
        </div>
        <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/15 font-semibold flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>X API Connected</span>
        </span>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex-1 relative">
          <Search className="w-4.5 h-4.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search published posts..."
            className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-lg border border-slate-850 text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold">Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-sky-500 font-semibold"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* HISTORY LIST */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            Published Logs ({filteredPosts.length})
          </h3>
          <span className="text-[10px] bg-slate-950 text-slate-500 px-2 py-0.5 rounded font-mono">
            Archival synchronization
          </span>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <History className="w-10 h-10 text-slate-700 mb-2" />
            <p className="text-sm font-semibold">No Published Posts Found</p>
            <p className="text-xs text-slate-600 mt-1">There are no matching items in your publishing history archive.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const metrics = getEngagementMetrics(post);
              return (
                <div key={post.id} className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl hover:bg-slate-950/70 transition-all flex flex-col md:flex-row justify-between items-start gap-4">
                  {/* Left Body Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        post.category === 'Technology' ? 'bg-purple-500/10 text-purple-400' :
                        post.category === 'Cryptocurrency' ? 'bg-amber-500/10 text-amber-400' :
                        post.category === 'Business' ? 'bg-emerald-500/10 text-emerald-400' :
                        post.category === 'Breaking News' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/15 px-1.5 py-0.2 rounded font-mono font-medium">
                        <Twitter className="w-2.5 h-2.5" />
                        <span>{post.targetXHandle || '@AIPressRoom'}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Published {post.publishedTime ? new Date(post.publishedTime).toLocaleString() : new Date(post.detectedAt).toLocaleString()}
                      </span>
                      {post.sourceName && post.sourceName !== 'Manual Entry' && (
                        <span className="text-[10px] text-slate-600 font-mono">
                          via {post.sourceName}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 text-sm leading-relaxed font-sans select-text">
                      {post.selectedPostText}
                    </p>
                  </div>

                  {/* Right Metrics Block */}
                  <div className="flex flex-wrap md:flex-col items-start md:items-end shrink-0 gap-3 md:gap-4 w-full md:w-auto border-t md:border-t-0 border-slate-850 pt-3 md:pt-0">
                    <div className="grid grid-cols-4 md:grid-cols-2 gap-4 text-left md:text-right">
                      <div>
                        <div className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1 justify-end">
                          <Eye className="w-3 h-3 text-slate-600" />
                          Views
                        </div>
                        <div className="text-xs font-bold font-mono text-slate-200">{metrics.impressions}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1 justify-end">
                          <ThumbsUp className="w-3 h-3 text-slate-600" />
                          Likes
                        </div>
                        <div className="text-xs font-bold font-mono text-slate-200">{metrics.likes}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1 justify-end">
                          <Share2 className="w-3 h-3 text-slate-600" />
                          Reposts
                        </div>
                        <div className="text-xs font-bold font-mono text-slate-200">{metrics.reposts}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1 justify-end">
                          <BarChart className="w-3 h-3 text-slate-600" />
                          Clicks
                        </div>
                        <div className="text-xs font-bold font-mono text-slate-200">{metrics.clicks}</div>
                      </div>
                    </div>

                    {/* Quick actions inside history */}
                    <div className="flex gap-2 justify-end w-full">
                      {post.sourceUrl && (
                        <a
                          href={post.sourceUrl}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 p-1.5 rounded text-slate-400 hover:text-white transition-all"
                          title="Original Article"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="bg-slate-900 border border-slate-800 hover:bg-rose-950/40 p-1.5 rounded text-slate-500 hover:text-rose-400 transition-all"
                        title="Delete from Log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
