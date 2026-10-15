import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layers, ArrowRight, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Input, Button, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import ZetocoLogo from '../components/common/ZetocoLogo';
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
      addToast('Welcome back to Zetoco!', 'success');
      navigate(fromPath, { replace: true });
    } else {
      setFormError(result.error);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#111114] border border-[#292930] rounded-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle top ambient glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center mb-4 hover:scale-105 transition-transform"
          >
            <ZetocoLogo size="xl" symbolOnly imageClassName="drop-shadow-lg" />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight">
            Sign in to {APP_NAME}
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-1.5">
            Welcome back. Authenticate with your workspace credentials.
          </p>
        </div>

        {/* Configuration Notice if Supabase is not set */}
        {!isConfigured && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-bold">Supabase Setup Required</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                Add <code className="bg-[#0B0B0E] px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_URL</code> and <code className="bg-[#0B0B0E] px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_ANON_KEY</code> to <code className="text-amber-100">client/.env</code> to enable live authentication.
              </p>
            </div>
          </div>
        )}


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
              <label className="text-xs font-semibold text-[#A1A1AA]">Password</label>
              <button
                type="button"
                onClick={() => addToast('Please contact your organization administrator or use demo credentials.', 'info')}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#F5F5F7] p-1 transition-colors"
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

        <div className="mt-8 pt-6 border-t border-[#1F1F24] text-center">
          <p className="text-xs text-[#A1A1AA]">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
