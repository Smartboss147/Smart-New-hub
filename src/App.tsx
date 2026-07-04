import { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, RefreshCw, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
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
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* TOP STATUS BAR */}
        <header className="h-14 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-mono">AI News Crawler Operational</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Loader Indicator */}
            {isProcessing && (
              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>AI Processing...</span>
              </span>
            )}
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Model: gemini-3.5-flash</span>
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
      </main>
    </div>
  );
}
