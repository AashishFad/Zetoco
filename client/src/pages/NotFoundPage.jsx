import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-6">
        <Layers className="w-8 h-8 text-indigo-400" />
      </div>
      <h1 className="text-6xl font-extrabold text-white tracking-tight">404</h1>
      <h2 className="text-xl font-semibold text-slate-200 mt-2">Page Not Found</h2>
      <p className="text-sm text-slate-400 mt-2 max-w-sm">
        The route you are trying to access does not exist in FlowSync.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>
    </div>
  );
}
