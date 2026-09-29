import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, ArrowRight, ShieldCheck } from 'lucide-react';
import ApiStatusBadge from './ApiStatusBadge';
import { APP_NAME } from '../../constants';

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              {APP_NAME}
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Phase 1
              </span>
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/' ? 'text-indigo-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            Overview
          </Link>
          <a
            href="#features"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#architecture"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Architecture
          </a>
          <a
            href="#roadmap"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Roadmap
          </a>
        </nav>

        {/* Right CTA Actions & Status */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            <ApiStatusBadge />
          </div>

          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Sign In
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg shadow-md shadow-indigo-600/30 transition-all hover:translate-y-[-1px]"
          >
            <span>Dashboard Shell</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
