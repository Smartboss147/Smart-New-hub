import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  RefreshCw,
  Eye,
  Hash,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  Sliders,
  Calendar,
  Layers,
  FileText,
  Image,
  Video,
  Film,
  UploadCloud,
  X,
  Paperclip,
  Link,
  Twitter
} from 'lucide-react';
import { Post } from '../types.js';
import { calculateSimilarity, evaluatePostSafety } from '../utils.js';

interface ApprovalDashboardProps {
  posts: Post[];
  onUpdatePost: (id: string, updates: Partial<Post>) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
  onRegeneratePost: (id: string, instructions: string) => Promise<void>;
  isProcessing: boolean;
}

export default function ApprovalDashboard({
  posts,
  onUpdatePost,
  onDeletePost,
  onRegeneratePost,
  isProcessing
}: ApprovalDashboardProps) {
  // Only display pending and draft posts in the Approval queue
  const pendingPosts = posts.filter(p => p.status === 'pending');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(
    pendingPosts.length > 0 ? pendingPosts[0].id : null
  );

  // Fallback if the selected post was updated/removed
  const selectedPost = pendingPosts.find(p => p.id === selectedPostId) || pendingPosts[0];

  const [editText, setEditText] = useState<string>('');
  const [isMobileDetailView, setIsMobileDetailView] = useState<boolean>(false);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [targetXHandleText, setTargetXHandleText] = useState<string>('');

  // Media attachment states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [mediaUrlInput, setMediaUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [captionText, setCaptionText] = useState<string>('');

  // Synchronize edit text, caption & X handle state when selected post changes
  React.useEffect(() => {
    if (selectedPost) {
      setEditText(selectedPost.selectedPostText);
      setCaptionText(selectedPost.imageCaption || '');
      setTargetXHandleText(selectedPost.targetXHandle || '@AIPressRoom');
    }
  }, [selectedPostId, selectedPost]);

  // Track post selection switches
  const handleSelectPost = (id: string) => {
    setSelectedPostId(id);
    const post = pendingPosts.find(p => p.id === id);
    if (post) {
      setEditText(post.selectedPostText);
      setCaptionText(post.imageCaption || '');
      setTargetXHandleText(post.targetXHandle || '@AIPressRoom');
    }
    setIsMobileDetailView(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await handleFileProcess(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await handleFileProcess(file);
    }
  };

  const handleFileProcess = (file: File) => {
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.webm');
        if (isVideo) {
          await onUpdatePost(postToRender.id, {
            videoUrl: result,
            imageUrl: undefined
          });
        } else {
          await onUpdatePost(postToRender.id, {
            imageUrl: result,
            videoUrl: undefined
          });
        }
        resolve();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddMediaUrl = async () => {
    if (!mediaUrlInput.trim()) return;
    const url = mediaUrlInput.trim();
    const isVideo = url.match(/\.(mp4|webm|mov|ogg)/i) || url.includes('video') || url.includes('assets.mixkit.co');
    if (isVideo) {
      await onUpdatePost(postToRender.id, {
        videoUrl: url,
        imageUrl: undefined
      });
    } else {
      await onUpdatePost(postToRender.id, {
        imageUrl: url,
        videoUrl: undefined
      });
    }
    setMediaUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemoveMedia = async () => {
    await onUpdatePost(postToRender.id, {
      imageUrl: undefined,
      videoUrl: undefined,
      imageCaption: undefined
    });
    setCaptionText('');
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaptionText(e.target.value);
  };

  const handleCaptionBlur = async () => {
    await onUpdatePost(postToRender.id, {
      imageCaption: captionText
    });
  };

  if (pendingPosts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-950/20">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md shadow-xl">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Queue is Clear!</h2>
          <p className="text-slate-400 text-sm mb-6">
            There are no pending posts awaiting your approval. Click "Sync & Check Feeds" to monitor X accounts or RSS feeds for new articles.
          </p>
        </div>
      </div>
    );
  }

  const postToRender = selectedPost || pendingPosts[0];
  const currentText = editText !== undefined ? editText : postToRender.selectedPostText;

  // Calculate similarity on edited text vs original source content
  const originalTextToCompare = postToRender.sourceContent || postToRender.sourceTitle || '';
  const currentSimilarity = calculateSimilarity(currentText, originalTextToCompare);

  // Calculate safety status on edited text
  const otherPostsText = posts.filter(p => p.id !== postToRender.id).map(p => p.selectedPostText);
  const safety = evaluatePostSafety(currentText, otherPostsText);

  const charCount = currentText.length;
  const isOverCharLimit = charCount > 280;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
  };

  const handleSelectVariation = (text: string) => {
    setEditText(text);
  };

  const handleApprovePublish = async () => {
    if (isOverCharLimit) return;
    await onUpdatePost(postToRender.id, {
      selectedPostText: currentText,
      similarityScore: currentSimilarity,
      status: 'published',
      publishedTime: new Date().toISOString(),
      targetXHandle: targetXHandleText
    });
    // Autoselect next in queue
    const nextPending = pendingPosts.filter(p => p.id !== postToRender.id);
    if (nextPending.length > 0) {
      handleSelectPost(nextPending[0].id);
    }
  };

  const handleSaveAsDraft = async () => {
    await onUpdatePost(postToRender.id, {
      selectedPostText: currentText,
      similarityScore: currentSimilarity,
      status: 'draft',
      targetXHandle: targetXHandleText
    });
    const nextPending = pendingPosts.filter(p => p.id !== postToRender.id);
    if (nextPending.length > 0) {
      handleSelectPost(nextPending[0].id);
    }
  };

  const handleRejectPost = async () => {
    await onUpdatePost(postToRender.id, {
      status: 'rejected'
    });
    const nextPending = pendingPosts.filter(p => p.id !== postToRender.id);
    if (nextPending.length > 0) {
      handleSelectPost(nextPending[0].id);
    }
  };

  const handleOpenSchedule = () => {
    // Set some default tomorrow date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
    setScheduleTime('09:00');
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = async () => {
    if (!scheduleDate || !scheduleTime) return;
    const datetime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    await onUpdatePost(postToRender.id, {
      selectedPostText: currentText,
      similarityScore: currentSimilarity,
      status: 'scheduled',
      scheduledTime: datetime,
      targetXHandle: targetXHandleText
    });
    setShowScheduleModal(false);
    
    const nextPending = pendingPosts.filter(p => p.id !== postToRender.id);
    if (nextPending.length > 0) {
      handleSelectPost(nextPending[0].id);
    }
  };

  const handleTriggerRegen = async () => {
    setIsRegenerating(true);
    try {
      await onRegeneratePost(postToRender.id, customInstructions);
      setCustomInstructions('');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950/30">
      {/* LEFT PANEL: Queue List */}
      <div className={`w-full lg:w-80 border-r border-slate-800/80 bg-slate-900/50 flex flex-col h-full overflow-y-auto ${isMobileDetailView ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-white text-sm tracking-wider uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Queue ({pendingPosts.length})
          </h2>
          <span className="bg-sky-500/10 text-sky-400 text-xs font-semibold px-2 py-0.5 rounded-full">
            Pending Approval
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1">
          {pendingPosts.map((post) => {
            const isSelected = post.id === postToRender.id;
            return (
              <button
                key={post.id}
                onClick={() => handleSelectPost(post.id)}
                className={`w-full text-left p-4 transition-all duration-150 relative ${
                  isSelected ? 'bg-slate-800/70 border-l-4 border-sky-500' : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex gap-3 items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="text-xs font-mono font-medium text-slate-500 truncate max-w-[120px]">
                        {post.sourceName || 'Manual Entry'}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        post.category === 'Technology' ? 'bg-purple-500/10 text-purple-400' :
                        post.category === 'Cryptocurrency' ? 'bg-amber-500/10 text-amber-400' :
                        post.category === 'Business' ? 'bg-emerald-500/10 text-emerald-400' :
                        post.category === 'Breaking News' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {post.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-200 text-sm line-clamp-2 leading-tight mb-2">
                      {post.sourceTitle || post.selectedPostText}
                    </h3>
                  </div>
                  {(post.imageUrl || post.videoUrl) && (
                    <div className="w-12 h-12 rounded-lg bg-slate-950/80 border border-slate-800/80 shrink-0 overflow-hidden relative mt-1 flex items-center justify-center">
                      {post.imageUrl ? (
                        <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                          <Film className="w-4 h-4 text-purple-400" />
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 p-0.5 bg-slate-950/80 rounded-tl">
                        {post.imageUrl ? (
                          <Image className="w-2.5 h-2.5 text-sky-400" />
                        ) : (
                          <Video className="w-2.5 h-2.5 text-purple-400" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono mt-1">
                  <span>{new Date(post.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex gap-2 items-center">
                    <span className="flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      {post.aiConfidenceScore}%
                    </span>
                    <span className={`flex items-center gap-0.5 font-bold ${
                      post.similarityScore > 25 ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      Sim: {post.similarityScore}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL: Focused Post Inspector & Actions */}
      <div className={`flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-6 ${isMobileDetailView ? 'flex' : 'hidden lg:flex'}`}>
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-start gap-3">
            {isMobileDetailView && (
              <button
                onClick={() => setIsMobileDetailView(false)}
                className="lg:hidden p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-semibold">Queue</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs text-sky-400 font-bold tracking-wider uppercase">{postToRender.category}</span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-500 font-mono">Detected {new Date(postToRender.detectedAt).toLocaleString()}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{postToRender.sourceTitle || 'Custom Content Generation'}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRejectPost}
              className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 font-medium text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
            <button
              onClick={handleSaveAsDraft}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>
          </div>
        </div>

        {/* BENTO GRID BLOCK */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* COLUMN 1: Source Article Extraction Details */}
          <div className="space-y-6 bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                Original Source Analysis
              </h3>
              {postToRender.sourceUrl && (
                <a
                  href={postToRender.sourceUrl}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="text-slate-400 hover:text-sky-400 flex items-center gap-1 text-xs font-mono"
                >
                  <span>View Original</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Source Content Body */}
            {postToRender.sourceContent && (
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase">Article Paragraph Snippet</span>
                <p className="text-slate-400 text-xs leading-relaxed max-h-40 overflow-y-auto bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                  {postToRender.sourceContent}
                </p>
              </div>
            )}

            {/* Key Facts Extracted by Gemini */}
            {postToRender.generatedKeyFacts && postToRender.generatedKeyFacts.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-slate-500 font-bold uppercase">AI Extracted Key Facts</span>
                <ul className="space-y-2">
                  {postToRender.generatedKeyFacts.map((fact, index) => (
                    <li key={index} className="flex gap-2.5 items-start text-xs text-slate-300">
                      <span className="bg-sky-500/20 text-sky-400 font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="leading-tight">{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary Extracted */}
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-bold uppercase">Original Summary</span>
              <p className="text-slate-300 text-xs leading-relaxed bg-indigo-950/15 border border-indigo-950/50 p-3 rounded-lg">
                {postToRender.generatedSummary}
              </p>
            </div>

            {/* AI Parameters */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                <div className="text-[10px] text-slate-500 font-mono uppercase mb-0.5">AI Confidence</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white font-mono">{postToRender.aiConfidenceScore}%</span>
                  <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${postToRender.aiConfidenceScore}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                <div className="text-[10px] text-slate-500 font-mono uppercase mb-0.5">Hashtags Generated</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {postToRender.suggestedHashtags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Generated Post & Plagiarism Safeguard */}
          <div className="space-y-6">
            
            {/* COMPOSER BOX */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  X Composer
                </h3>
              </div>

              {/* Target X Handle and Char Counter Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div className="flex items-center gap-2">
                  <Twitter className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-semibold">Post Target:</span>
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-slate-500 font-mono text-xs select-none">@</span>
                    <input
                      type="text"
                      value={targetXHandleText.replace(/^@/, '')}
                      onChange={(e) => setTargetXHandleText(`@${e.target.value.trim().replace(/^@/, '')}`)}
                      placeholder="AIPressRoom"
                      className="bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 pl-6 text-xs text-slate-200 outline-none focus:border-sky-500 font-mono w-40"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className={`text-xs font-mono font-bold ${isOverCharLimit ? 'text-rose-500' : 'text-slate-400'}`}>
                    {charCount}/280
                  </span>
                  {isOverCharLimit && (
                    <span className="text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded">
                      Over Limit
                    </span>
                  )}
                </div>
              </div>

              {/* Text Area */}
              <textarea
                value={currentText}
                onChange={handleTextChange}
                rows={4}
                className="w-full bg-slate-950 text-slate-200 p-3.5 rounded-xl border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm leading-relaxed resize-none outline-none font-sans"
                placeholder="Compose or edit AI generated post..."
              />

              {/* MEDIA ATTACHMENTS BLOCK */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                    Post Media Updates
                  </span>
                  {!postToRender.imageUrl && !postToRender.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1"
                    >
                      <Link className="w-3 h-3" />
                      <span>{showUrlInput ? 'Hide URL Input' : 'Add Web URL'}</span>
                    </button>
                  )}
                </div>

                {/* Web URL input drawer */}
                {showUrlInput && !postToRender.imageUrl && !postToRender.videoUrl && (
                  <div className="flex gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 animate-in slide-in-from-top-2 duration-150">
                    <input
                      type="text"
                      placeholder="Paste Unsplash, image, or video URL..."
                      value={mediaUrlInput}
                      onChange={(e) => setMediaUrlInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddMediaUrl}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Attach
                    </button>
                  </div>
                )}

                {/* Active Media Previewers */}
                {postToRender.imageUrl ? (
                  <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-3">
                    <div className="relative group overflow-hidden rounded-lg bg-slate-900 aspect-video max-h-56 flex items-center justify-center">
                      <img
                        src={postToRender.imageUrl}
                        alt="Post media preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Remove Button overlay */}
                      <button
                        type="button"
                        onClick={handleRemoveMedia}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-slate-950 transition-all shadow-lg"
                        title="Remove Picture"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Image Caption Edit Field */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">Image Alt text / Caption</label>
                      <input
                        type="text"
                        placeholder="Describe this picture for screen readers..."
                        value={captionText}
                        onChange={handleCaptionChange}
                        onBlur={handleCaptionBlur}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                ) : postToRender.videoUrl ? (
                  <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-3">
                    <div className="relative group overflow-hidden rounded-lg bg-slate-900 aspect-video max-h-56 flex items-center justify-center">
                      <video
                        src={postToRender.videoUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                      {/* Remove Button overlay */}
                      <button
                        type="button"
                        onClick={handleRemoveMedia}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-slate-950 transition-all shadow-lg z-10"
                        title="Remove Video"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-mono bg-purple-950/20 border border-purple-800/20 px-2 py-1 rounded-lg">
                      <Film className="w-3.5 h-3.5 shrink-0" />
                      <span>Active Video Update Attached — Ready to post</span>
                    </div>
                  </div>
                ) : (
                  /* Drag and Drop File Upload Dropzone */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('media-file-input')?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-950/10 text-whiteScale shadow-inner scale-[0.99]'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <input
                      id="media-file-input"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <UploadCloud className={`w-8 h-8 mb-2 ${isDragging ? 'text-indigo-400 animate-bounce' : 'text-slate-500'}`} />
                    <p className="text-xs font-semibold leading-normal mb-1">
                      {isDragging ? 'Drop media file now!' : 'Drag & drop a picture or video here'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      or click to browse local files (Supports JPEG, PNG, MP4, WebM)
                    </p>
                  </div>
                )}
              </div>

              {/* Plagiarism Similarity Guard */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-slate-300">Similarity Guard (Anti-Plagiarism)</span>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                    currentSimilarity > 25 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {currentSimilarity}% Overlap
                  </span>
                </div>

                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      currentSimilarity > 25 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(currentSimilarity || 5, 100)}%` }}
                  />
                </div>

                <div className="text-[11px] leading-relaxed text-slate-400">
                  {currentSimilarity > 25 ? (
                    <div className="flex gap-1.5 items-start text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        <strong>Plagiarism Warning!</strong> High similarity to source text. Standard guidelines mandate rewriting to avoid account suspension on X. Click an alternate version below or regenerate with instructions.
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 items-start text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        <strong>Copyright Clear:</strong> Post is highly original and preserves core factual accuracy while avoiding duplicate wording. Safe to publish.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Anti-Spam / Account Safety Check */}
              <div className="p-3.5 rounded-xl border border-slate-800/60 bg-slate-950/50 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">Safety Verification</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                    safety.riskLevel === 'high' ? 'bg-rose-500/10 text-rose-400' :
                    safety.riskLevel === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {safety.riskLevel} risk
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {safety.riskMessage}
                </p>
              </div>

              {/* Action Rows */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleOpenSchedule}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-slate-700 shadow-sm"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Schedule Post</span>
                </button>
                <button
                  onClick={handleApprovePublish}
                  disabled={isOverCharLimit}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-600/15"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  <span>Approve & Publish</span>
                </button>
              </div>
            </div>

            {/* AI TUNER & REGENERATION */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase block">Refine with AI Instructions</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g., 'Make it punchier', 'Write a formal version'"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleTriggerRegen}
                  disabled={isRegenerating}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-4 rounded-xl text-xs flex items-center gap-2 transition-all shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>Rewrite</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Alternate Variations */}
        {postToRender.suggestedPosts && postToRender.suggestedPosts.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              Alternate Generated Copies (Varying Styles)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {postToRender.suggestedPosts.map((postText, index) => {
                const isCurrent = postText === currentText;
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectVariation(postText)}
                    className={`text-left p-4 rounded-xl border text-xs transition-all flex flex-col justify-between h-full ${
                      isCurrent
                        ? 'bg-sky-950/20 border-sky-500/80 ring-1 ring-sky-500/30'
                        : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/20'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-400 font-mono">Style Option #{index + 1}</span>
                        {index === 0 && <span className="text-[10px] bg-sky-500/10 text-sky-400 px-1 py-0.2 rounded">Recommended</span>}
                        {index === 1 && <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1 py-0.2 rounded">Stats Focus</span>}
                        {index === 2 && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded">Engaging Hook</span>}
                      </div>
                      <p className="text-slate-300 leading-relaxed font-sans line-clamp-4">
                        {postText}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800/40 w-full text-[10px] text-slate-500 font-mono">
                      <span>{postText.length} chars</span>
                      <span className="text-sky-400 font-medium">Click to Load</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SCHEDULE DIALOG MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-400" />
                Schedule Publication
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Select Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Select Time (UTC)</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-sky-500"
                />
              </div>

              <div className="p-3 bg-indigo-950/15 border border-indigo-950/40 rounded-xl text-xs text-slate-400 leading-normal">
                Scheduling randomized buffers of 5-10 minutes is enabled to safeguard your account against automated bot-like posting patterns.
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-xs font-semibold text-slate-400 hover:text-white px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
