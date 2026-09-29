import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layers, ArrowRight, Lock, Mail, Eye, EyeOff, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { Input, Button, Badge, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../constants';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { signIn, isConfigured, authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const fromPath = location.state?.from?.pathname || '/dashboard';

  const handleQuickFill = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('DemoPass123!');
    setFormError('');
    clearError();
    addToast(`Filled demo credentials for ${roleEmail}`, 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email.trim() || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn({ email, password });
    setIsSubmitting(false);

    if (result.success) {
      addToast('Welcome back to FlowSync!', 'success');
      navigate(fromPath, { replace: true });
    } else {
      setFormError(result.error);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface-900 border border-surface-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Top Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-indigo-400 to-cyan-400" />

        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 items-center justify-center shadow-lg shadow-brand-600/30 mb-4 hover:scale-105 transition-transform"
          >
            <Layers className="w-6 h-6 text-white" />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign in to {APP_NAME}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            Authenticate with your Supabase credentials.
          </p>
        </div>

        {/* Configuration Notice if Supabase is not set */}
        {!isConfigured && (
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-bold">Supabase Setup Required</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                Add <code className="bg-surface-950 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_URL</code> and <code className="bg-surface-950 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_ANON_KEY</code> to <code className="text-amber-100">client/.env</code> to enable live authentication.
              </p>
            </div>
          </div>
        )}

        {/* Recruiter 1-Click Fast Login Pill */}
        <div className="mb-6 p-3.5 rounded-2xl bg-surface-950/80 border border-surface-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" /> Quick Credentials
            </span>
            <Badge variant="brand" size="xs">Recruiter Demo</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('lead@flowsync.dev')}
              className="px-2.5 py-1.5 rounded-lg bg-surface-850 hover:bg-surface-800 border border-surface-700/80 text-[11px] font-medium text-slate-200 transition-colors text-left truncate"
            >
              👑 lead@flowsync.dev
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('demo@flowsync.dev')}
              className="px-2.5 py-1.5 rounded-lg bg-surface-850 hover:bg-surface-800 border border-surface-700/80 text-[11px] font-medium text-slate-200 transition-colors text-left truncate"
            >
              📋 demo@flowsync.dev
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {(formError || authError) && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{formError || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFormError('');
            }}
            leftIcon={Mail}
            disabled={isSubmitting}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => addToast('Password reset via Supabase Auth is planned for future phases', 'info')}
                className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFormError('');
                }}
                leftIcon={Lock}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
            rightIcon={ArrowRight}
            className="mt-2"
          >
            Sign In to Workspace
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-surface-800 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="text-brand-400 hover:text-brand-300 font-bold transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
