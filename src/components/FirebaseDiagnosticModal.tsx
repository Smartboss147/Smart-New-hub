import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react';

interface DiagnosticStatus {
  isConfigured: boolean;
  isConnected: boolean;
  error: string | null;
  firebaseUrl: string | null;
  env: {
    FIREBASE_DATABASE_URL: boolean;
    FIREBASE_SERVICE_ACCOUNT: boolean;
    FIREBASE_DATABASE_SECRET: boolean;
  };
}

export default function FirebaseDiagnosticModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<DiagnosticStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = () => {
    setLoading(true);
    fetch('/api/db-status')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch db status:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            Firebase Diagnostic Tool
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Checking...
            </div>
          ) : status ? (
            <div className="space-y-4 text-sm font-mono">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Connection Status:</span>
                <span className={`flex items-center gap-1 font-bold ${status.isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {status.isConnected ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {status.isConnected ? 'CONNECTED' : 'FAILED'}
                </span>
              </div>
              
              <div className="space-y-2 text-xs text-slate-500">
                <p>URL Configured: {status.isConfigured ? 'Yes' : 'No'}</p>
                <p>Database URL: {status.firebaseUrl || 'Not set'}</p>
              </div>

              {status.error && (
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/50 text-rose-300 text-xs leading-relaxed">
                  <strong className="block mb-1">Error Details:</strong>
                  {status.error}
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block mb-2">Environment Variables:</span>
                <p className={status.env.FIREBASE_DATABASE_URL ? 'text-emerald-400' : 'text-slate-600'}>
                  {status.env.FIREBASE_DATABASE_URL ? '✓' : '✗'} FIREBASE_DATABASE_URL
                </p>
                <p className={status.env.FIREBASE_SERVICE_ACCOUNT ? 'text-emerald-400' : 'text-slate-600'}>
                  {status.env.FIREBASE_SERVICE_ACCOUNT ? '✓' : '✗'} FIREBASE_SERVICE_ACCOUNT
                </p>
                <p className={status.env.FIREBASE_DATABASE_SECRET ? 'text-emerald-400' : 'text-slate-600'}>
                  {status.env.FIREBASE_DATABASE_SECRET ? '✓' : '✗'} FIREBASE_DATABASE_SECRET
                </p>
              </div>
            </div>
          ) : (
            <p className="text-rose-400">Failed to load diagnostic data.</p>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button 
            onClick={checkStatus}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}
