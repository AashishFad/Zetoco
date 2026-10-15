import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui';
import ZetocoLogo from './ZetocoLogo';

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#080808]/90 border-b border-[#292930]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center group">
          <ZetocoLogo size="sm" showText className="group-hover:opacity-90 transition-opacity" />
        </Link>


        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-[#17171C] font-medium text-xs sm:text-sm px-3.5 py-1.5"
            >
              Sign In
            </Button>
          </Link>

          <Link to="/dashboard">
            <Button
              size="sm"
              rightIcon={ArrowRight}
              className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium text-xs sm:text-sm px-4 py-1.5 shadow-md shadow-indigo-950/50 border-t border-indigo-400/30"
            >
              Launch Workspace
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
