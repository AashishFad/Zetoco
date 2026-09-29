import React, { useEffect, useState } from 'react';
import { checkApiHealth } from '../../services/healthService';
import { Activity, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ApiStatusBadge() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const [lastCheck, setLastCheck] = useState(null);

  const verifyBackend = async () => {
    setStatus('checking');
    try {
      const data = await checkApiHealth();
      if (data && data.success) {
        setStatus('online');
        setLastCheck(new Date().toLocaleTimeString());
      } else {
        setStatus('offline');
      }
    } catch (error) {
      setStatus('offline');
      setLastCheck(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    verifyBackend();
    const interval = setInterval(verifyBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors bg-slate-800/80 border-slate-700">
      {status === 'checking' && (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span className="text-amber-300">Checking API...</span>
        </>
      )}
      {status === 'online' && (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-300">Backend API Online</span>
          {lastCheck && <span className="text-slate-400 text-[10px]">({lastCheck})</span>}
        </>
      )}
      {status === 'offline' && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-rose-300">Backend API Disconnected</span>
          <button
            onClick={verifyBackend}
            className="ml-1 text-[10px] underline text-slate-400 hover:text-slate-200"
            title="Retry Connection"
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
}
