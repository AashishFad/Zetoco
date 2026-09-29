import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';
import ApiStatusBadge from './ApiStatusBadge';
import { Button, Badge } from '../ui';
import { APP_NAME } from '../../constants';

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-surface-950/80 border-b border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              {APP_NAME}
              <Badge variant="brand" size="xs">Phase 2</Badge>
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`text-sm font-semibold transition-colors ${
              location.pathname === '/' ? 'text-brand-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            Overview
          </Link>
          <a
            href="#features"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#architecture"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Architecture
          </a>
          <a
            href="#roadmap"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Roadmap
          </a>
        </nav>

        {/* Right CTA Actions & Status */}
        <div className="flex items-center gap-3.5">
          <div className="hidden lg:block">
            <ApiStatusBadge />
          </div>

          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>

          <Link to="/dashboard">
            <Button size="sm" rightIcon={ArrowRight}>
              Live Demo
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
