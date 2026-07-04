import { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, RefreshCw, AlertCircle, CheckCircle, ShieldAlert, Menu, X, ExternalLink, TrendingUp } from 'lucide-react';
import Sidebar from './components/Sidebar.tsx';
import ApprovalDashboard from './components/ApprovalDashboard.tsx';
import ManualPublisher from './components/ManualPublisher.tsx';
import SourceManager from './components/SourceManager.tsx';
import CalendarScheduler from './components/CalendarScheduler.tsx';
import PostHistory from './components/PostHistory.tsx';
import XSettings from './components/XSettings.tsx';
import AnalyticsView from './components/AnalyticsView.tsx';
import { Source, Post } from './types.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Trend alerts state
  const [activeTrend, setActiveTrend] = useState<{
    topic: string;
    category: string;
    similarityScore: number;
    sources: string[];
    articles: { title: string; source: string; link: string }[];
    detectedAt: string;
  } | null>(null);

  const triggerBrowserNotification = (trend: any) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('🚨 Trend Alert: Breaking Topic!', {
            body: `Surge in coverage detected for "${trend.topic}" across ${trend.sources.join(' & ')}`,
            icon: '/favicon.ico'
          });
        } catch (e) {
          console.error('Failed to trigger native Notification:', e);
        }
      }
    }
  };

  // Data Loading
  const loadData = async () => {
    try {
      const [sourcesRes, postsRes] = await Promise.all([
        fetch('/api/sources'),
        fetch('/api/posts')
      ]);
      const sourcesData = await sourcesRes.json();
      const postsData = await postsRes.json();
      setSources(sourcesData);
      setPosts(postsData);
    } catch (err) {
      console.error('Error loading initial data:', err);
      showNotification('error', 'Could not sync data with server. Check database JSON connection.');
    }
  };

  useEffect(() => {
    loadData();
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => {
        console.warn('Notification permission request error:', err);
      });
    }
  }, []);

  // Source Handlers
  const handleAddSource = async (sourceData: Omit<Source, 'id' | 'addedAt'>) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceData)
      });
      if (!res.ok) throw new Error('Failed to create source');
      const newSource = await res.json();
      setSources((prev) => [...prev, newSource]);
      showNotification('success', `Channel "${newSource.name}" subscribed successfully.`);
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      const res = await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete source');
      setSources((prev) => prev.filter((s) => s.id !== id));
      showNotification('success', 'Source channel removed.');
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleUpdateSource = async (id: string, updates: Partial<Source>) => {
    // Basic local state swap
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    showNotification('info', 'Source status updated.');
  };

  // Post Handlers
  const handleAddPost = async (postData: any) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      if (!res.ok) throw new Error('Failed to save manual post');
      const newPost = await res.json();
      setPosts((prev) => [newPost, ...prev]);
      showNotification(
        'success',
        newPost.status === 'published'
          ? 'Post published directly to X!'
          : newPost.status === 'scheduled'
          ? 'Post scheduled successfully!'
          : 'Draft saved successfully.'
      );
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePost = async (id: string, updates: Partial<Post>) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update post');
      const updatedPost = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === id ? updatedPost : p)));
      
      if (updates.status === 'published') {
        showNotification('success', 'Post published directly to X!');
      } else if (updates.status === 'scheduled') {
        showNotification('success', 'Post scheduled onto Calendar!');
      } else if (updates.status === 'rejected') {
        showNotification('info', 'Post rejected and removed from approval queue.');
      } else {
        showNotification('success', 'Post edited and saved.');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete post');
      setPosts((prev) => prev.filter((p) => p.id !== id));
      showNotification('success', 'Scheduled post cancelled and removed.');
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleRegeneratePost = async (id: string, instructions: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/posts/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions })
      });
      if (!res.ok) throw new Error('AI Regeneration failed');
      const updatedPost = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === id ? updatedPost : p)));
      showNotification('success', 'AI has generated fresh variations based on instructions.');
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Monitor Feeds Handler (Polling Sync Check)
  const handleMonitorFeeds = async () => {
    setIsMonitoring(true);
    try {
      const res = await fetch('/api/sources/monitor', { method: 'POST' });
      if (!res.ok) throw new Error('Monitoring sync failed');
      const data = await res.json();
      
      // Reload posts
      const postsRes = await fetch('/api/posts');
      const postsData = await postsRes.json();
      setPosts(postsData);

      // Trigger Trend Alert if a surge is detected
      if (data.trendAlert) {
        setActiveTrend(data.trendAlert);
        triggerBrowserNotification(data.trendAlert);
      }

      if (data.newPendingPostsCreated > 0) {
        showNotification(
          'success',
          `Checked feeds! Detected ${data.newArticlesProcessed} new articles. Generated ${data.newPendingPostsCreated} approval queue items.`
        );
      } else {
        showNotification('info', 'Checked feeds. No new articles detected at this time.');
      }
    } catch (err: any) {
      showNotification('error', `Feed monitoring sync error: ${err.message}`);
    } finally {
      setIsMonitoring(false);
    }
  };

  // Render correct Active View
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ApprovalDashboard
            posts={posts}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            onRegeneratePost={handleRegeneratePost}
            isProcessing={isProcessing}
          />
        );
      case 'publisher':
        return <ManualPublisher onAddPost={handleAddPost} isProcessing={isProcessing} />;
      case 'sources':
        return (
          <SourceManager
            sources={sources}
            onAddSource={handleAddSource}
            onDeleteSource={handleDeleteSource}
            onUpdateSource={handleUpdateSource}
            isMonitoring={isMonitoring}
            onMonitor={handleMonitorFeeds}
          />
        );
      case 'calendar':
        return (
          <CalendarScheduler
            posts={posts}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
          />
        );
      case 'history':
        return <PostHistory posts={posts} onDeletePost={handleDeletePost} />;
      case 'analytics':
        return <AnalyticsView posts={posts} />;
      case 'settings':
        return <XSettings />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-slate-400 font-mono">
            Selected view coming soon.
          </div>
        );
    }
  };

  // Counter badges for sidebar status metrics
  const pendingCount = posts.filter((p) => p.status === 'pending').length;
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden antialiased">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        scheduledCount={scheduledCount}
        isMonitoring={isMonitoring}
        onMonitor={handleMonitorFeeds}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* TOP STATUS BAR */}
        <header className="h-14 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">AI News Crawler Operational</span>
              <span className="text-xs text-slate-400 font-mono sm:hidden">Operational</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Loader Indicator */}
            {isProcessing && (
              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span className="hidden sm:inline">AI Processing...</span>
              </span>
            )}
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Model: gemini-3.5-flash</span>
              <span className="sm:hidden">Gemini</span>
            </div>
          </div>
        </header>

        {/* Dynamic Alert Notification Toast */}
        {notification && (
          <div className="absolute top-16 right-6 z-50 animate-bounce">
            <div className={`p-4 rounded-xl shadow-2xl border flex items-start gap-3 max-w-sm ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
                : notification.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
                : 'bg-indigo-950/90 border-indigo-500/30 text-indigo-300'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : notification.type === 'error' ? (
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              )}
              <p className="text-xs font-medium leading-relaxed">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Main View Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {renderActiveView()}
        </div>

        {/* Trend Alert Modal Overlay */}
        {activeTrend && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden animate-in fade-in zoom-in duration-250">
              
              {/* Header Gradient Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500" />
              
              {/* Close Button */}
              <button
                onClick={() => setActiveTrend(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6">
                {/* Header Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-xs text-red-400 font-bold uppercase tracking-widest font-mono">🚨 Trend Alert Detected</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-indigo-400 font-mono bg-indigo-950/50 border border-indigo-800/50 px-2 py-0.5 rounded-full">
                    Overlap: {activeTrend.similarityScore}%
                  </span>
                </div>

                {/* Topic Name */}
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-3">
                  {activeTrend.topic}
                </h3>

                {/* Explanation */}
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  A sudden surge in coverage has been detected across multiple independent channels. Our news crawler identified similar breaking details from <strong className="text-sky-400">{activeTrend.sources.join(' and ')}</strong>.
                </p>

                {/* Articles list */}
                <div className="space-y-3 mb-6">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Matched Coverage</span>
                  {activeTrend.articles.map((art: any, index: number) => (
                    <a
                      key={index}
                      href={art.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl bg-slate-950/60 border border-slate-800/85 hover:border-indigo-500/30 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[10px] text-indigo-400 font-bold font-mono uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded-md w-fit">
                            {art.source}
                          </span>
                          <span className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                            {art.title}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 shrink-0 mt-0.5" />
                      </div>
                    </a>
                  ))}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveTab('dashboard');
                      setActiveTrend(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Review AI Drafts in Queue</span>
                  </button>
                  <button
                    onClick={() => setActiveTrend(null)}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
