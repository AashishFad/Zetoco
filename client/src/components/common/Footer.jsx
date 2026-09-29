import React from 'react';
import { Layers, Github, Terminal, Heart } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../constants';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/60 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white tracking-tight">{APP_NAME}</p>
              <p className="text-xs text-slate-400">{APP_TAGLINE}</p>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-xs text-slate-400">
              Full-Stack Portfolio Project • Recruiter Demonstration
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Phase 1: Project Foundation & Architecture (React + Express + PostgreSQL)
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
