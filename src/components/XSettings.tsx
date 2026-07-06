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
  Instagram,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Bell,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface XConfigState {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
  isConnected: boolean;
  xHandle?: string;
}

interface InstagramConfigState {
  accessToken: string;
  businessAccountId: string;
  isConnected: boolean;
  instagramHandle?: string;
}

export default function XSettings() {
  const [activeTab, setActiveTab] = useState<'x' | 'instagram' | 'safety'>('x');

  const [xConfig, setXConfig] = useState<XConfigState>({
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    accessSecret: '',
    isConnected: false,
    xHandle: ''
  });

  const [instagramConfig, setInstagramConfig] = useState<InstagramConfigState>({
    accessToken: '',
    businessAccountId: '',
    isConnected: false,
    instagramHandle: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingX, setIsSavingX] = useState(false);
  const [isSavingInsta, setIsSavingInsta] = useState(false);
  const [successX, setSuccessX] = useState(false);
  const [successInsta, setSuccessInsta] = useState(false);

  // Anti-Spam & Safety Parameters
  const [maxPerHour, setMaxPerHour] = useState(2);
  const [requireHumanApproval, setRequireHumanApproval] = useState(true);
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  const [stripExcessHashtags, setStripExcessHashtags] = useState(true);
  const [showTokens, setShowTokens] = useState(false);

  useEffect(() => {
    // Load config from backend
    Promise.all([
      fetch('/api/x-config').then(res => res.json()),
      fetch('/api/instagram-config').then(res => res.json())
    ])
      .then(([xData, instaData]) => {
        setXConfig(xData);
        setInstagramConfig(instaData);
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to load configs:', err);
        setIsLoading(false);
      });
  }, []);

  const handleSaveX = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingX(true);
    setSuccessX(false);

    try {
      const res = await fetch('/api/x-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(xConfig)
      });
      const data = await res.json();
      setXConfig(prev => ({ ...prev, isConnected: data.isConnected }));
      setSuccessX(true);
      setTimeout(() => setSuccessX(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingX(false);
    }
  };

  const handleSaveInstagram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInsta(true);
    setSuccessInsta(false);

    try {
      const res = await fetch('/api/instagram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instagramConfig)
      });
      const data = await res.json();
      setInstagramConfig(prev => ({ ...prev, isConnected: data.isConnected }));
      setSuccessInsta(true);
      setTimeout(() => setSuccessInsta(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingInsta(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center text-slate-400 min-h-[400px]">
        <div className="animate-pulse font-mono text-xs">Loading Secure Credentials...</div>
      </div>
    );
  }

  const isPipelineActive = xConfig.isConnected || instagramConfig.isConnected;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-950/20 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Social Media Integrations</h1>
          <p className="text-xs text-slate-400">Configure OAuth credentials, Meta Graph APIs, and protective automated publishing rules.</p>
        </div>
        <div>
          {isPipelineActive ? (
            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/15 font-semibold flex items-center gap-1.5 w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Publisher Pipeline Active</span>
            </span>
          ) : (
            <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full border border-amber-500/15 font-semibold flex items-center gap-1.5 w-fit animate-pulse">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Sandbox Simulation Mode</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 p-0.5 gap-2">
        <button
          onClick={() => setActiveTab('x')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'x'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Twitter className={`w-4 h-4 ${activeTab === 'x' ? 'text-sky-400' : 'text-slate-500'}`} />
          <span>Twitter/X Integration</span>
        </button>
        <button
          onClick={() => setActiveTab('instagram')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'instagram'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Instagram className={`w-4 h-4 ${activeTab === 'instagram' ? 'text-pink-400' : 'text-slate-500'}`} />
          <span>Instagram Integration</span>
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'safety'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className={`w-4 h-4 ${activeTab === 'safety' ? 'text-indigo-400' : 'text-slate-500'}`} />
          <span>Platform Safety Rules</span>
        </button>
      </div>

      {/* Dynamic Tab Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
        >
          {/* Tab 1: X Integration */}
          {activeTab === 'x' && (
            <>
              <form onSubmit={handleSaveX} className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-5 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2">
                    <Key className="w-4 h-4 text-sky-400" />
                    Twitter/X API Credentials (OAuth 1.0a)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTokens(!showTokens)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
                  >
                    {showTokens ? 'Mask Keys' : 'Reveal Keys'}
                  </button>
                </div>

                {successX && (
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                    <span>X developer settings updated successfully! API connection saved.</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Handle */}
                  <div className="flex flex-col gap-1.5 bg-sky-500/5 p-3.5 rounded-xl border border-sky-500/10">
                    <label className="text-xs text-sky-400 font-semibold flex items-center gap-1.5">
                      <Twitter className="w-3.5 h-3.5 text-sky-400" />
                      <span>Target X Account Handle</span>
                    </label>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed">
                      The public username where news, game previews, and betting tip briefs are posted.
                    </p>
                    <div className="relative flex items-center mt-1">
                      <span className="absolute left-3.5 text-slate-400 font-mono text-xs select-none">@</span>
                      <input
                        type="text"
                        value={(xConfig.xHandle || '').replace(/^@/, '')}
                        onChange={(e) => setXConfig({ ...xConfig, xHandle: `@${e.target.value.trim().replace(/^@/, '')}` })}
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
                      value={xConfig.apiKey}
                      onChange={(e) => setXConfig({ ...xConfig, apiKey: e.target.value })}
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
                      value={xConfig.apiSecret}
                      onChange={(e) => setXConfig({ ...xConfig, apiSecret: e.target.value })}
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
                      value={xConfig.accessToken}
                      onChange={(e) => setXConfig({ ...xConfig, accessToken: e.target.value })}
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
                      value={xConfig.accessSecret}
                      onChange={(e) => setXConfig({ ...xConfig, accessSecret: e.target.value })}
                      placeholder="Paste X Access Token Secret"
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingX}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-600/10"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingX ? 'Saving...' : 'Save & Secure X Connection'}</span>
                  </button>
                </div>
              </form>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4 text-xs">
                <h4 className="font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                  <Info className="w-4 h-4 text-sky-400" />
                  X Setup Instructions
                </h4>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  To obtain these credentials:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-slate-400 text-[11px]">
                  <li>Navigate to the <a href="https://developer.twitter.com" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">X Developer Portal</a>.</li>
                  <li>Create a Project and an App, then configure **User Authentication Settings**:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-500">
                      <li>App Permissions: Choose **Read and Write**.</li>
                      <li>Type of App: Select **Web App, Automated, or Bot**.</li>
                    </ul>
                  </li>
                  <li>Go to the "Keys and Tokens" tab and generate the Consumer Keys and User Access Tokens with **OAuth 1.0a User Context** access.</li>
                </ol>
              </div>
            </>
          )}

          {/* Tab 2: Instagram Integration */}
          {activeTab === 'instagram' && (
            <>
              <form onSubmit={handleSaveInstagram} className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-5 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2">
                    <Key className="w-4 h-4 text-pink-400" />
                    Instagram Meta Graph API Settings
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTokens(!showTokens)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
                  >
                    {showTokens ? 'Mask Keys' : 'Reveal Keys'}
                  </button>
                </div>

                {successInsta && (
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                    <span>Instagram Meta Graph API settings updated successfully! Connection saved.</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Handle */}
                  <div className="flex flex-col gap-1.5 bg-pink-500/5 p-3.5 rounded-xl border border-pink-500/10">
                    <label className="text-xs text-pink-400 font-semibold flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-400" />
                      <span>Instagram Business Handle</span>
                    </label>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed">
                      The public Instagram username where sports graphics, betting cards, and newsletters will be shared.
                    </p>
                    <div className="relative flex items-center mt-1">
                      <span className="absolute left-3.5 text-slate-400 font-mono text-xs select-none">@</span>
                      <input
                        type="text"
                        value={(instagramConfig.instagramHandle || '').replace(/^@/, '')}
                        onChange={(e) => setInstagramConfig({ ...instagramConfig, instagramHandle: `@${e.target.value.trim().replace(/^@/, '')}` })}
                        placeholder="AISportsHub"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-3 text-xs text-slate-200 outline-none focus:border-pink-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Page Access Token */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>Meta Page Access Token</span>
                    </label>
                    <textarea
                      type={showTokens ? 'text' : 'password'}
                      value={instagramConfig.accessToken}
                      onChange={(e) => setInstagramConfig({ ...instagramConfig, accessToken: e.target.value })}
                      placeholder="Paste your long-lived Meta Page/User Access Token with instagram_basic & instagram_content_publish scopes"
                      rows={3}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-pink-500 font-mono resize-none"
                    />
                  </div>

                  {/* Business Account ID */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>Instagram Business Account ID</span>
                    </label>
                    <input
                      type="text"
                      value={instagramConfig.businessAccountId}
                      onChange={(e) => setInstagramConfig({ ...instagramConfig, businessAccountId: e.target.value.trim() })}
                      placeholder="e.g. 17841401234567890"
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-pink-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingInsta}
                    className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-pink-600/10"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingInsta ? 'Saving...' : 'Save & Secure Instagram Connection'}</span>
                  </button>
                </div>
              </form>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4 text-xs">
                <h4 className="font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                  <Info className="w-4 h-4 text-pink-400" />
                  Instagram API Guide
                </h4>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  To publish posts to Instagram automatically, you must use the Meta Graph Content Publishing API:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-slate-400 text-[11px]">
                  <li>Connect your **Instagram Professional Account** (Business or Creator) to a **Facebook Page** that you manage.</li>
                  <li>Register a Meta App in the <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-pink-400 hover:underline">Facebook Developer Portal</a>.</li>
                  <li>Obtain a **Long-Lived Page Access Token** or User Access Token containing these permissions:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-slate-500">
                      <li>`instagram_basic`</li>
                      <li>`instagram_content_publish`</li>
                      <li>`pages_show_list`</li>
                    </ul>
                  </li>
                  <li>Retrieve your 17-digit **Instagram Business Account ID** by querying `/me/accounts?fields=instagram_business_account` via the Graph API Explorer.</li>
                </ol>
              </div>
            </>
          )}

          {/* Tab 3: Platform Safety Rules */}
          {activeTab === 'safety' && (
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6 text-xs max-w-3xl mx-auto w-full">
              <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-slate-200 text-sm tracking-tight">Spam Prevention & Safety Valve Filters</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Control publication frequency, duplication checking, and shadowban shields.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rate limiting slider */}
                <div className="flex flex-col gap-2 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-300">Publishing Valve Limit</span>
                    <span className="font-mono text-sky-400 font-bold">{maxPerHour} posts/hr</span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-snug mb-3">
                    Throttle publication frequency to match regular human activity patterns. Prevents robotic behavioral flagging by X and Meta spam algorithms.
                  </p>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={maxPerHour}
                    onChange={(e) => setMaxPerHour(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Switch: Duplicate filter */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-850">
                  <div className="pr-4">
                    <span className="font-bold text-slate-300 block">Smart Duplicate Blocker</span>
                    <span className="text-[10px] text-slate-500 leading-normal block mt-1">
                      Uses cosine-similarity checks to prevent identical messages from being posted consecutively, protecting accounts against API suspension.
                    </span>
                  </div>
                  <button onClick={() => setPreventDuplicates(!preventDuplicates)} className="text-slate-400 hover:text-white shrink-0">
                    {preventDuplicates ? (
                      <ToggleRight className="w-7 h-7 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-600" />
                    )}
                  </button>
                </div>

                {/* Switch: Strip hashtags */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-850">
                  <div className="pr-4">
                    <span className="font-bold text-slate-300 block">Hashtag Moderation</span>
                    <span className="text-[10px] text-slate-500 leading-normal block mt-1">
                      Trims down excess or irrelevant hashtags automatically. Recommended to maintain high text clarity and avoid social media platform shadowbans.
                    </span>
                  </div>
                  <button onClick={() => setStripExcessHashtags(!stripExcessHashtags)} className="text-slate-400 hover:text-white shrink-0">
                    {stripExcessHashtags ? (
                      <ToggleRight className="w-7 h-7 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-600" />
                    )}
                  </button>
                </div>

                {/* Switch: Mandatory Human Approval */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-850">
                  <div className="pr-4">
                    <span className="font-bold text-slate-300 block">Mandatory Admin Handshake</span>
                    <span className="text-[10px] text-slate-500 leading-normal block mt-1">
                      Strict gatekeeper rule. No posts, feed summaries, or betting suggestions will be sent to public API streams unless you explicitly click "Publish" in the queue.
                    </span>
                  </div>
                  <button onClick={() => setRequireHumanApproval(!requireHumanApproval)} className="text-slate-400 hover:text-white shrink-0" disabled>
                    {requireHumanApproval ? (
                      <ToggleRight className="w-7 h-7 text-emerald-500 opacity-60 cursor-not-allowed" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex gap-2 text-[11px] text-slate-400 leading-normal">
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Sandbox Guardrail:</strong> When either Twitter/X or Instagram are disconnected, the scheduler is decoupled from real network endpoints and operates in an eye-safe simulation mode. This allows you to completely audit, refine, and preview your publishing workflows without incurring API calls or exposing credentials.
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
