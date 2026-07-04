import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  Clock,
  Send,
  Trash2,
  AlertTriangle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  HelpCircle,
  ArrowRight,
  Zap,
  Film,
  UploadCloud,
  X,
  Paperclip,
  Video,
  Twitter
} from 'lucide-react';
import { CATEGORIES } from '../utils.js';

interface ManualPublisherProps {
  onAddPost: (post: {
    sourceName: string;
    sourceTitle: string;
    sourceContent: string;
    category: string;
    selectedPostText: string;
    status: 'draft' | 'scheduled' | 'published';
    scheduledTime?: string;
    imageUrl?: string;
    imageCaption?: string;
    videoUrl?: string;
    targetXHandle?: string;
  }) => Promise<void>;
  isProcessing: boolean;
}

export default function ManualPublisher({ onAddPost, isProcessing }: ManualPublisherProps) {
  const [text, setText] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('Technology');
  const [link, setLink] = useState<string>('');
  const [targetXHandle, setTargetXHandle] = useState<string>('');
  
  // Real media states
  const [imageUrl, setImageUrl] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [imageCaption, setImageCaption] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [mediaUrlInput, setMediaUrlInput] = useState<string>('');

  const [isExpanding, setIsExpanding] = useState<boolean>(false);
  const [expansionPrompt, setExpansionPrompt] = useState<string>('');
  const [showAiAssist, setShowAiAssist] = useState<boolean>(false);

  // Scheduling states
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [showScheduler, setShowScheduler] = useState<boolean>(false);

  useEffect(() => {
    // Load default X handle config
    fetch('/api/x-config')
      .then(res => res.json())
      .then(data => {
        if (data && data.xHandle) {
          setTargetXHandle(data.xHandle);
        }
      })
      .catch(err => console.error('Error fetching X handle config for publisher:', err));
  }, []);

  const charCount = text.length;
  const isOverCharLimit = charCount > 280;

  const handleClear = () => {
    setText('');
    setTitle('');
    setCategory('Technology');
    setLink('');
    setImageUrl('');
    setVideoUrl('');
    setImageCaption('');
    setShowScheduler(false);
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
          setVideoUrl(result);
          setImageUrl('');
        } else {
          setImageUrl(result);
          setVideoUrl('');
        }
        resolve();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddMediaUrl = () => {
    if (!mediaUrlInput.trim()) return;
    const url = mediaUrlInput.trim();
    const isVideo = url.match(/\.(mp4|webm|mov|ogg)/i) || url.includes('video') || url.includes('assets.mixkit.co');
    if (isVideo) {
      setVideoUrl(url);
      setImageUrl('');
    } else {
      setImageUrl(url);
      setVideoUrl('');
    }
    setMediaUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemoveMedia = () => {
    setImageUrl('');
    setVideoUrl('');
    setImageCaption('');
  };

  const handleAiExpand = async () => {
    if (!expansionPrompt) return;
    setIsExpanding(true);
    try {
      const prompt = `
        Category: ${category}
        Rough thought/topic: "${expansionPrompt}"
        Goal: Expand this thought into a professional, highly engaging, punchy X (Twitter) post under 280 characters.
        Include 2 relevant hashtags at the end. Keep the tone conversational, thought-provoking, and natural. Do not be overly promotional.
      `;

      // Call server regenerate-like endpoint by mocking or fetching a fresh generation
      const response = await fetch('/api/sources/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }); // Triggering monitor first, but wait! Let's write a custom API for general text expansion or let them use Gemini.
      // Actually we can create a direct endpoint or we can use the monitor logic or we can simulate it on backend if we have a direct endpoint, but wait! Let's handle it beautifully.
      // We can fetch from an expansion endpoint or query Gemini on the backend.
      // Let's call /api/posts with a draft status, but first expand it via a custom inline call or generate.
      // Wait, we can write a dedicated endpoint `/api/ai/expand` in server.ts! Let's make sure we support it or simulate it beautifully.
      // Let's implement an actual fetch to `/api/posts/:id/regenerate` or a general utility.
      // Wait! Let's look at server.ts. We can add `/api/ai/expand` or make a general endpoint. We will write it in server.ts.
      // For now, let's call `/api/ai/expand` and we will edit server.ts to add it.
      
      const res = await fetch('/api/ai/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: expansionPrompt, category })
      });
      const data = await res.json();
      if (data.expandedText) {
        setText(data.expandedText);
        setTitle(expansionPrompt.substring(0, 40) + '...');
        setShowAiAssist(false);
        setExpansionPrompt('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleSubmit = async (status: 'draft' | 'scheduled' | 'published') => {
    if (!text) return;
    if (isOverCharLimit) return;

    let scheduledTimeStr: string | undefined = undefined;
    if (status === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        alert('Please select date and time for scheduling.');
        return;
      }
      scheduledTimeStr = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    await onAddPost({
      sourceName: 'Manual Entry',
      sourceTitle: title || 'Manual Thought',
      sourceContent: link ? `Shared Link: ${link}` : 'Manually composed content',
      category,
      selectedPostText: text,
      status,
      scheduledTime: scheduledTimeStr,
      imageUrl: imageUrl || undefined,
      imageCaption: imageCaption || undefined,
      videoUrl: videoUrl || undefined,
      targetXHandle: targetXHandle || undefined
    });

    handleClear();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-950/20 max-w-4xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Manual Composer</h1>
          <p className="text-xs text-slate-400">Draft, analyze, schedule, or publish custom social media content immediately.</p>
        </div>
        <button
          onClick={() => setShowAiAssist(!showAiAssist)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>AI Expander Assist</span>
        </button>
      </div>

      {/* AI EXPANDER INLINE MODAL */}
      {showAiAssist && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/30 p-5 rounded-2xl space-y-3 shadow-xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              AI Thought Expander
            </span>
            <button onClick={() => setShowAiAssist(false)} className="text-xs text-slate-500 hover:text-slate-300">
              Dismiss
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Enter a rough idea or key words, select your category, and Gemini will spin it into a high-engagement tweet draft!
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={expansionPrompt}
              onChange={(e) => setExpansionPrompt(e.target.value)}
              placeholder="e.g., 'interest rates are cooling down, stock market likes it, bullish times ahead'"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-400"
            />
            <button
              onClick={handleAiExpand}
              disabled={isExpanding || !expansionPrompt}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isExpanding ? 'Expanding...' : 'Expand Thought'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* COMPOSER FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Editor Block (66%) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-400 uppercase">Compose Post Content</label>
            <span className={`text-xs font-mono font-bold ${isOverCharLimit ? 'text-rose-500' : 'text-slate-400'}`}>
              {charCount}/280
            </span>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm leading-relaxed resize-none outline-none font-sans"
            placeholder="Type your original post here..."
          />

          {isOverCharLimit && (
            <div className="flex gap-2 items-start text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Character limit exceeded!</strong> Standard X posts are capped at 280 characters. Consider editing or moving links/hashtags.
              </span>
            </div>
          )}

          {/* Schedler Sub-pane */}
          {showScheduler && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Publish Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Publish Time (UTC)</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
                />
              </div>
            </div>
          )}

          {/* Actions button bar */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={handleClear}
              className="text-slate-500 hover:text-slate-300 text-xs font-semibold px-2 py-2"
            >
              Clear Workspace
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit('draft')}
                disabled={!text || isProcessing}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all"
              >
                <Save className="w-3.5 h-3.5 text-slate-400" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={() => {
                  if (!showScheduler) {
                    setShowScheduler(true);
                  } else {
                    handleSubmit('scheduled');
                  }
                }}
                disabled={!text || isProcessing}
                className={`font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all border ${
                  showScheduler
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{showScheduler ? 'Confirm Schedule' : 'Schedule'}</span>
              </button>
              <button
                onClick={() => handleSubmit('published')}
                disabled={!text || isOverCharLimit || isProcessing}
                className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-600/10"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Publish Immediately</span>
              </button>
            </div>
          </div>
        </div>

        {/* Configurations column (34%) */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase border-b border-slate-800 pb-2">
              Metadata & Assets
            </h3>

            {/* Target X Handle */}
            <div className="flex flex-col gap-1.5 bg-sky-500/5 p-3 rounded-xl border border-sky-500/10">
              <label className="text-xs text-sky-400 font-semibold flex items-center gap-1.5">
                <Twitter className="w-3.5 h-3.5 text-sky-400" />
                <span>Target X Handle</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 font-mono text-xs select-none">@</span>
                <input
                  type="text"
                  value={targetXHandle.replace(/^@/, '')}
                  onChange={(e) => setTargetXHandle(`@${e.target.value.trim().replace(/^@/, '')}`)}
                  placeholder="AIPressRoom"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pl-7 text-xs text-slate-200 outline-none focus:border-sky-500 font-mono"
                />
              </div>
              <p className="text-[9.5px] text-slate-500 leading-normal">
                Will publish to this handle instead of default when clicked.
              </p>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Post Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 outline-none focus:border-sky-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <span>Working Title</span>
                <span className="text-[10px] text-slate-600 font-normal">(Internal only)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Thoughts on L2 scaling"
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 outline-none focus:border-sky-500"
              />
            </div>

            {/* Optional Link */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-slate-500" />
                <span>Reference URL</span>
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="e.g., https://myblog.com/post-title"
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 outline-none focus:border-sky-500"
              />
            </div>

            {/* Media Upload Block */}
            <div className="flex flex-col gap-2 border-t border-slate-800/60 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Post Media Attachments</span>
                </label>
                {!imageUrl && !videoUrl && (
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[10px] text-sky-400 hover:text-sky-300 font-mono flex items-center gap-0.5"
                  >
                    <LinkIcon className="w-2.5 h-2.5" />
                    <span>{showUrlInput ? 'Hide URL' : 'Add Web URL'}</span>
                  </button>
                )}
              </div>

              {/* Web URL input drawer */}
              {showUrlInput && !imageUrl && !videoUrl && (
                <div className="flex gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 animate-in slide-in-from-top-2 duration-150">
                  <input
                    type="text"
                    placeholder="Paste image or video URL..."
                    value={mediaUrlInput}
                    onChange={(e) => setMediaUrlInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-200 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddMediaUrl}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer"
                  >
                    Attach
                  </button>
                </div>
              )}

              {/* Active Media Previewers */}
              {imageUrl ? (
                <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-2.5 space-y-2">
                  <div className="relative group overflow-hidden rounded-lg bg-slate-900 aspect-video max-h-40 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Post media preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Remove Button overlay */}
                    <button
                      type="button; cursor-pointer"
                      onClick={handleRemoveMedia}
                      className="absolute top-2 right-2 p-1 rounded-full bg-slate-950/80 border border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-slate-950 transition-all shadow-lg cursor-pointer"
                      title="Remove Picture"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Image Caption Edit Field */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">Image Alt text / Caption</label>
                    <input
                      type="text"
                      placeholder="Describe this picture..."
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              ) : videoUrl ? (
                <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-2.5 space-y-2">
                  <div className="relative group overflow-hidden rounded-lg bg-slate-900 aspect-video max-h-40 flex items-center justify-center">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                    {/* Remove Button overlay */}
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      className="absolute top-2 right-2 p-1 rounded-full bg-slate-950/80 border border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-slate-950 transition-all shadow-lg z-10 cursor-pointer"
                      title="Remove Video"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-purple-400 font-mono bg-purple-950/20 border border-purple-800/20 px-2 py-0.5 rounded-lg">
                    <Film className="w-3 h-3 shrink-0" />
                    <span>Video Attached</span>
                  </div>
                </div>
              ) : (
                /* Drag and Drop File Upload Dropzone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('manual-media-file-input')?.click()}
                  className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-950/10 text-whiteScale shadow-inner scale-[0.99]'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <input
                    id="manual-media-file-input"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <UploadCloud className={`w-6 h-6 mb-1 ${isDragging ? 'text-indigo-400 animate-bounce' : 'text-slate-500'}`} />
                  <p className="text-[11px] font-semibold leading-normal">
                    {isDragging ? 'Drop media now!' : 'Drag & drop image/video'}
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">
                    or click to select file
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
