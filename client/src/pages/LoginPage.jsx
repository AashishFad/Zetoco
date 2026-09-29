import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Lock, Mail, Sparkles, UserCheck } from 'lucide-react';
import { Input, Button, Badge, useToast } from '../components/ui';
import { APP_NAME } from '../constants';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleQuickFill = (roleEmail, roleName) => {
    setEmail(roleEmail);
    setPassword('••••••••••••');
    addToast(`Filled demo credentials for ${roleName}`, 'info');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast('Signed in successfully (Phase 2 UI Demo)', 'success');
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface-900 border border-surface-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Accent Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-indigo-400 to-cyan-400" />

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 items-center justify-center shadow-lg shadow-brand-600/30 mb-4 hover:scale-105 transition-transform">
            <Layers className="w-6 h-6 text-white" />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign in to {APP_NAME}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            Access your agile workspace and team boards.
          </p>
        </div>

        {/* Recruiter 1-Click Fast Login Pill */}
        <div className="mb-6 p-3.5 rounded-2xl bg-surface-950/80 border border-surface-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" /> Quick Demo Fill
            </span>
            <Badge variant="brand" size="xs">Recruiter Demo</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('lead@flowsync.dev', 'Lead Engineer')}
              className="px-2.5 py-1.5 rounded-lg bg-surface-850 hover:bg-surface-800 border border-surface-700/80 text-[11px] font-medium text-slate-200 transition-colors text-left truncate"
            >
              👑 Lead Engineer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('pm@flowsync.dev', 'Product Manager')}
              className="px-2.5 py-1.5 rounded-lg bg-surface-850 hover:bg-surface-800 border border-surface-700/80 text-[11px] font-medium text-slate-200 transition-colors text-left truncate"
            >
              📋 Product Mgr
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={Mail}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => addToast('Password reset is simulated for demo', 'info')}
                className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={Lock}
              required
            />
          </div>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            rightIcon={ArrowRight}
            className="mt-2"
          >
            Sign In to Workspace
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-surface-800 text-center">
          <p className="text-xs text-slate-400">
            Don't have a workspace yet?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
