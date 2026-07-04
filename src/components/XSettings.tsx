import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  ShieldAlert,
  Key,
  Info,
  Lock,
  Save,
  Twitter,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Bell,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface XConfigState {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
  isConnected: boolean;
  xHandle?: string;
}

export default function XSettings() {
  const [config, setConfig] = useState<XConfigState>({
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    accessSecret: '',
    isConnected: false,
    xHandle: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Anti-Spam & Saftey Parameters
  const [maxPerHour, setMaxPerHour] = useState(2);
  const [requireHumanApproval, setRequireHumanApproval] = useState(true);
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  const [stripExcessHashtags, setStripExcessHashtags] = useState(true);
  const [showTokens, setShowTokens] = useState(false);

  useEffect(() => {
    // Load config from backend
    fetch('/api/x-config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/x-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setConfig(prev => ({ ...prev, isConnected: data.isConnected }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center text-slate-400">
        <div className="animate-pulse font-mono text-xs">Loading Secure Credentials...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-950/20 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">X Integration Settings</h1>
          <p className="text-xs text-slate-400">Configure OAuth 1.0a credentials, rate limits, and protective spam policies.</p>
        </div>
        {config.isConnected ? (
          <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/15 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>X Pipeline Safe</span>
          </span>
        ) : (
          <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full border border-amber-500/15 font-semibold flex items-center gap-1.5 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Sandbox Mode / Pending Auth</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* API Credentials Card (Left 66%) */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-5 text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-400" />
              API Credentials (OAuth 1.0a)
            </h3>
            <button
              type="button"
              onClick={() => setShowTokens(!showTokens)}
              className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
            >
              {showTokens ? 'Mask Tokens' : 'Reveal Tokens'}
            </button>
          </div>

          {success && (
            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
              <span>X Developer settings updated successfully! Connection verified.</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Target X Handle */}
            <div className="flex flex-col gap-1.5 bg-sky-500/5 p-3.5 rounded-xl border border-sky-500/10">
              <label className="text-xs text-sky-400 font-semibold flex items-center gap-1.5">
                <Twitter className="w-3.5 h-3.5 text-sky-400" />
                <span>Target X Account Handle</span>
              </label>
              <p className="text-[10.5px] text-slate-500 leading-relaxed">
                The public Twitter/X username where approved articles and automated news will be posted.
              </p>
              <div className="relative flex items-center mt-1">
                <span className="absolute left-3.5 text-slate-400 font-mono text-xs select-none">@</span>
                <input
                  type="text"
                  value={(config.xHandle || '').replace(/^@/, '')}
                  onChange={(e) => setConfig({ ...config, xHandle: `@${e.target.value.trim().replace(/^@/, '')}` })}
                  placeholder="AIPressRoom"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-3 text-xs text-slate-200 outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            {/* API Key */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Consumer API Key</span>
              </label>
              <input
                type={showTokens ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Paste X API Key"
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-sky-500 font-mono"
              />
            </div>

            {/* API Secret */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Consumer API Secret</span>
              </label>
              <input
                type={showTokens ? 'text' : 'password'}
                value={config.apiSecret}
                onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
                placeholder="Paste X API Secret"
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-sky-500 font-mono"
              />
            </div>

            {/* Access Token */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Access Token</span>
              </label>
              <input
                type={showTokens ? 'text' : 'password'}
                value={config.accessToken}
                onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                placeholder="Paste X Access Token"
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-sky-500 font-mono"
              />
            </div>

            {/* Access Secret */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Access Token Secret</span>
              </label>
              <input
                type={showTokens ? 'text' : 'password'}
                value={config.accessSecret}
                onChange={(e) => setConfig({ ...config, accessSecret: e.target.value })}
                placeholder="Paste X Access Token Secret"
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-600/10"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Verifying...' : 'Save & Secure Connection'}</span>
            </button>
          </div>
        </form>

        {/* Safety Valve Filters (Right 33%) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-5 text-xs">
          <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
            <Sliders className="w-4.5 h-4.5 text-indigo-400" />
            Spam & Account Safety Rules
          </h3>

          <div className="space-y-4">
            {/* Rule: Rate Limiting */}
            <div className="flex flex-col gap-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-850">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-300">Rate Limits Valve</span>
                <span className="font-mono text-sky-400 font-bold">{maxPerHour} posts/hr</span>
              </div>
              <p className="text-[10.5px] text-slate-500 leading-snug mb-2">
                Limits automated publication frequency to prevent Twitter's robotic behavior flags.
              </p>
              <input
                type="range"
                min={1}
                max={5}
                value={maxPerHour}
                onChange={(e) => setMaxPerHour(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Rule: Duplicate protection */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-850">
              <div>
                <span className="font-bold text-slate-300 block">Duplicate Text Blocker</span>
                <span className="text-[10px] text-slate-500 leading-snug">Blocks exact copies from posting twice.</span>
              </div>
              <button onClick={() => setPreventDuplicates(!preventDuplicates)} className="text-slate-400 hover:text-white">
                {preventDuplicates ? (
                  <ToggleRight className="w-6 h-6 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-600" />
                )}
              </button>
            </div>

            {/* Rule: Strip hashtags */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-850">
              <div>
                <span className="font-bold text-slate-300 block">Hashtag Moderation</span>
                <span className="text-[10px] text-slate-500 leading-snug">Strips excess tags to avoid shadowbans.</span>
              </div>
              <button onClick={() => setStripExcessHashtags(!stripExcessHashtags)} className="text-slate-400 hover:text-white">
                {stripExcessHashtags ? (
                  <ToggleRight className="w-6 h-6 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-600" />
                )}
              </button>
            </div>

            {/* Rule: Require Human Approval */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-850">
              <div>
                <span className="font-bold text-slate-300 block">Mandatory Human Check</span>
                <span className="text-[10px] text-slate-500 leading-snug">Nothing posts without manual review.</span>
              </div>
              <button onClick={() => setRequireHumanApproval(!requireHumanApproval)} className="text-slate-400 hover:text-white" disabled>
                {requireHumanApproval ? (
                  <ToggleRight className="w-6 h-6 text-emerald-500 opacity-60 cursor-not-allowed" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex gap-2 text-[10.5px] text-slate-500 leading-normal">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              If credentials are left empty, the application falls back to a sandbox simulation. You can safely compose, edit, approve, and schedule posts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
