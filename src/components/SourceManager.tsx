import React, { useState } from 'react';
import {
  Rss,
  Trash2,
  Plus,
  RefreshCw,
  Twitter,
  Globe,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  Info,
  Check,
  Hash,
  Instagram
} from 'lucide-react';
import { Source, SourceType } from '../types.js';
import { CATEGORIES } from '../utils.js';

interface SourceManagerProps {
  sources: Source[];
  onAddSource: (source: Omit<Source, 'id' | 'addedAt'>) => Promise<void>;
  onDeleteSource: (id: string) => Promise<void>;
  onUpdateSource: (id: string, updates: Partial<Source>) => Promise<void>;
  isMonitoring: boolean;
  onMonitor: () => void;
}

export default function SourceManager({
  sources,
  onAddSource,
  onDeleteSource,
  onUpdateSource,
  isMonitoring,
  onMonitor
}: SourceManagerProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<SourceType>('rss_feed');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Technology');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name || !url || !category) {
      setError('Please fill in all fields.');
      return;
    }

    // Basic URL check for RSS/Web
    if (type !== 'x_account' && type !== 'instagram_handle' && !url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Source URL must begin with http:// or https://');
      return;
    }

    // Basic handle check for X Account and Instagram Handle
    if (type === 'x_account' || type === 'instagram_handle') {
      let handle = url;
      if (handle.startsWith('@')) {
        handle = handle.substring(1);
      }
      if (handle.includes('/') || handle.includes(' ') || !handle) {
        setError(`Please provide a valid, clean ${type === 'x_account' ? 'X' : 'Instagram'} handle (e.g., @techcrunch)`);
        return;
      }
    }

    try {
      await onAddSource({
        name,
        type,
        url: (type === 'x_account' || type === 'instagram_handle') && !url.startsWith('@') ? `@${url}` : url,
        category,
        isActive: true
      });
      setSuccess(true);
      setName('');
      setUrl('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add source.');
    }
  };

  const handleToggleActive = async (source: Source) => {
    await onUpdateSource(source.id, { isActive: !source.isActive });
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-950/20 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Source Manager</h1>
          <p className="text-xs text-slate-400">Configure public X accounts, RSS streams, technology and crypto feeds to continuously monitor.</p>
        </div>
        <button
          onClick={onMonitor}
          disabled={isMonitoring}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isMonitoring ? 'animate-spin' : ''}`} />
          <span>{isMonitoring ? 'Syncing Feeds...' : 'Trigger Sync Check'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Monitored Sources List Table (66%) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2">
              <Rss className="w-4 h-4 text-sky-400" />
              Active Feed Channels ({sources.length})
            </h3>
            <span className="text-[10px] bg-slate-950 text-slate-500 px-2 py-0.5 rounded font-mono">
              Continuous Polling Enabled
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <th className="p-3.5 font-bold">Source / URL</th>
                  <th className="p-3.5 font-bold">Type</th>
                  <th className="p-3.5 font-bold">Category</th>
                  <th className="p-3.5 font-bold">Status</th>
                  <th className="p-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sources.map((src) => (
                  <tr key={src.id} className="hover:bg-slate-900/30 transition-all">
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">{src.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]" title={src.url}>
                        {src.url}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="flex items-center gap-1.5 font-medium text-slate-300">
                        {src.type === 'x_account' ? (
                          <>
                            <Twitter className="w-3.5 h-3.5 text-sky-400 fill-sky-400/10" />
                            <span>X Account</span>
                          </>
                        ) : src.type === 'instagram_handle' ? (
                          <>
                            <Instagram className="w-3.5 h-3.5 text-pink-400 fill-pink-400/10" />
                            <span>Instagram</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-3.5 h-3.5 text-indigo-400" />
                            <span>RSS Feed</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-800/80 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                        {src.category}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleActive(src)}
                        className="text-slate-400 hover:text-white transition-all"
                        title={src.isActive ? 'Pause monitoring' : 'Resume monitoring'}
                      >
                        {src.isActive ? (
                          <div className="flex items-center gap-1 text-emerald-500">
                            <ToggleRight className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span className="text-[10px] font-semibold">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-600">
                            <ToggleLeft className="w-5 h-5 text-slate-600 shrink-0" />
                            <span className="text-[10px] font-semibold">Paused</span>
                          </div>
                        )}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onDeleteSource(src.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/60 transition-all"
                        title="Delete source"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Source Block (34%) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
            <PlusCircle className="w-4.5 h-4.5 text-indigo-400" />
            Add Feed Source
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-2.5 rounded-xl text-xs">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-2.5 rounded-xl flex items-center gap-1.5 text-xs">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Source subscribed successfully!</span>
              </div>
            )}

            {/* Source Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Source Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType('rss_feed');
                    setUrl('https://');
                  }}
                  className={`py-2 px-1.5 rounded-xl border text-center font-semibold text-[10px] sm:text-xs transition-all flex flex-col items-center justify-center gap-1 ${
                    type === 'rss_feed'
                      ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>RSS Feed</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('x_account');
                    setUrl('@');
                  }}
                  className={`py-2 px-1.5 rounded-xl border text-center font-semibold text-[10px] sm:text-xs transition-all flex flex-col items-center justify-center gap-1 ${
                    type === 'x_account'
                      ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Twitter className="w-3.5 h-3.5" />
                  <span>X Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('instagram_handle');
                    setUrl('@');
                  }}
                  className={`py-2 px-1.5 rounded-xl border text-center font-semibold text-[10px] sm:text-xs transition-all flex flex-col items-center justify-center gap-1 ${
                    type === 'instagram_handle'
                      ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </button>
              </div>
            </div>

            {/* Friendly Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Friendly Channel Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Bloomberg Crypto, @mazi_tundeednut"
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            {/* URL or Handle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">
                {type === 'x_account' ? 'X Account Handle' : type === 'instagram_handle' ? 'Instagram Handle' : 'Feed RSS URL'}
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={type === 'x_account' ? 'e.g., @elonmusk' : type === 'instagram_handle' ? 'e.g., @mazi_tundeednut' : 'e.g., https://site.com/feed/rss'}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Feed Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Subscribe Channel</span>
            </button>
          </form>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 flex gap-2 text-[10.5px] text-slate-500 leading-normal">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              The content scheduler runs periodically on our server container to check active channels for updates, utilizing Gemini reasoning loops to extract facts and draft X copies automatically.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
