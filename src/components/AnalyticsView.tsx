import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  FileText,
  ThumbsUp,
  Eye,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  Award
} from 'lucide-react';
import { Post } from '../types.js';

interface AnalyticsViewProps {
  posts: Post[];
}

export default function AnalyticsView({ posts }: AnalyticsViewProps) {
  const published = posts.filter(p => p.status === 'published');
  const scheduled = posts.filter(p => p.status === 'scheduled');
  const drafts = posts.filter(p => p.status === 'draft');
  const pending = posts.filter(p => p.status === 'pending');

  // Group posts by Category
  const categoryMap: { [key: string]: number } = {};
  posts.forEach(p => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
  });
  const categoryData = Object.keys(categoryMap).map(cat => ({
    name: cat,
    posts: categoryMap[cat]
  })).sort((a, b) => b.posts - a.posts);

  // Growth / Post over time (7 days history)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyData = days.map((day, idx) => {
    // Generate some deterministic stats based on published posts index
    const count = published.filter((_, pIdx) => (pIdx + idx) % 7 === 0).length + (idx % 2);
    const views = count * 650 + (idx * 140);
    const engagement = count * 45 + (idx * 8);

    return {
      day,
      posts: count,
      views,
      engagement
    };
  });

  // Top Performing Posts with mock engagement details
  const topPosts = published.map((post, idx) => {
    const charLen = post.selectedPostText.length;
    const views = 500 + (charLen * 3) + (idx * 120);
    const likes = Math.round(views * 0.08);
    const ctr = (3.5 + (idx % 3) * 0.8).toFixed(1);

    return {
      id: post.id,
      text: post.selectedPostText,
      category: post.category,
      views,
      likes,
      ctr: `${ctr}%`
    };
  }).sort((a, b) => b.views - a.views).slice(0, 3);

  // Visual Palette
  const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-950/20 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5.5 h-5.5 text-sky-400" />
          Content Performance Analytics
        </h1>
        <p className="text-xs text-slate-400">Track visual engagement telemetry, publication volume, and model effectiveness metrics.</p>
      </div>

      {/* STATS HIGHLIGHT WIDGETS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Published */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Total Published</span>
            <div className="text-xl font-bold font-mono text-white">{published.length}</div>
            <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>+12.4% this wk</span>
            </div>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 shrink-0">
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Total Scheduled */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Queued Calendar</span>
            <div className="text-xl font-bold font-mono text-white">{scheduled.length}</div>
            <div className="text-[10px] text-sky-400 font-bold flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>Buffer healthy</span>
            </div>
          </div>
          <div className="bg-sky-500/10 p-3 rounded-xl border border-sky-500/20 shrink-0">
            <Clock className="w-5 h-5 text-sky-400" />
          </div>
        </div>

        {/* Total Drafts */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Offline Drafts</span>
            <div className="text-xl font-bold font-mono text-white">{drafts.length}</div>
            <div className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
              <span>Ready to polish</span>
            </div>
          </div>
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 shrink-0">
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        {/* Total Impressions */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Impressions Sync</span>
            <div className="text-xl font-bold font-mono text-white">
              {published.reduce((sum, _, idx) => sum + 500 + (idx * 120), 0)}
            </div>
            <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>+8.2% avg CTR</span>
            </div>
          </div>
          <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 shrink-0">
            <Eye className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* GRAPHS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Posting & Views Trend Line Chart (66%) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              Views & Posting Volume (Weekly Trend)
            </h3>
            <span className="text-[9px] bg-slate-950 text-slate-500 px-2 py-0.5 rounded font-mono font-bold">
              Double Axis Telemetry
            </span>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis yAxisId="left" stroke="#0ea5e9" label={{ value: 'Views', angle: -90, position: 'insideLeft', offset: 0, fill: '#0ea5e9' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" label={{ value: 'Post Count', angle: 90, position: 'insideRight', fill: '#8b5cf6' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#cbd5e1' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="views" stroke="#0ea5e9" name="Impressions" strokeWidth={2} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="posts" stroke="#8b5cf6" name="Postings" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown (34%) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Category Coverage
            </h3>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-600 font-mono text-[11px] text-center">
              No category metrics.<br />Publish or queue some posts to view.
            </div>
          ) : (
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#cbd5e1' }} />
                  <Bar dataKey="posts" fill="#6366f1" name="Count" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* TOP PERFORMING POSTS TABLE */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2">
            <Award className="w-4 h-4 text-sky-400" />
            Top-Performing Tweets
          </h3>
          <span className="text-[10px] bg-slate-950 text-slate-500 px-2 py-0.5 rounded font-mono">
            Ranked by total impressions
          </span>
        </div>

        {topPosts.length === 0 ? (
          <div className="p-8 text-center text-slate-600 font-mono text-[11px]">
            Archive log empty. Top performing posts will render here upon successful publication.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <th className="p-3.5 font-bold">Post Copy Text</th>
                  <th className="p-3.5 font-bold">Category</th>
                  <th className="p-3.5 font-bold text-right">Views</th>
                  <th className="p-3.5 font-bold text-right">Likes</th>
                  <th className="p-3.5 font-bold text-right">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {topPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-950/40 transition-all">
                    <td className="p-3.5 max-w-sm truncate font-medium text-slate-200" title={post.text}>
                      {post.text}
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-850 text-slate-400 font-semibold px-2 py-0.5 rounded font-mono text-[10px]">
                        {post.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-slate-300 font-mono font-bold">{post.views}</td>
                    <td className="p-3.5 text-right text-emerald-400 font-mono font-bold">{post.likes}</td>
                    <td className="p-3.5 text-right text-sky-400 font-mono font-bold">{post.ctr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
