import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Inbox } from 'lucide-react';
import { Input, Button, Badge, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../constants';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  const { signUp, isConfigured, authError, clearError } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    // Client-side validation
    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await signUp({ email, password, fullName });
    setIsSubmitting(false);

    if (result.success) {
      if (result.needsEmailConfirmation) {
        setEmailConfirmationRequired(true);
        addToast('Account created! Please check your email to confirm.', 'info');
      } else {
        addToast(`Welcome to FlowSync, ${fullName}!`, 'success');
        navigate('/dashboard', { replace: true });
      }
    } else {
      setFormError(result.error);
    }
  };

  // If email confirmation is required by Supabase project settings, show verification card
  if (emailConfirmationRequired) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-surface-900 border border-surface-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />

          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 text-emerald-400">
            <Inbox className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Verify your email
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            We have sent a verification link to <strong className="text-white">{email}</strong>.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Click the link in the email to activate your account, then sign in below.
          </p>

          <div className="mt-8 space-y-3">
            <Link to="/login">
              <Button fullWidth size="md" rightIcon={ArrowRight}>
                Go to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface-900 border border-surface-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-indigo-400 to-cyan-400" />

        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 items-center justify-center shadow-lg shadow-brand-600/30 mb-4 hover:scale-105 transition-transform"
          >
            <Layers className="w-6 h-6 text-white" />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create your Account
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            Get started with {APP_NAME} in less than a minute.
          </p>
        </div>

        {/* Configuration Notice if Supabase is not set */}
        {!isConfigured && (
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-bold">Supabase Setup Required</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                Add <code className="bg-surface-950 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_URL</code> and <code className="bg-surface-950 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_ANON_KEY</code> to <code className="text-amber-100">client/.env</code> to enable live registration.
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
            label="Full Name"
            placeholder="e.g. Aashish Fad"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setFormError('');
            }}
            leftIcon={User}
            disabled={isSubmitting}
            required
          />

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Input
                label="Password"
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
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-200 p-1"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div>
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFormError('');
                }}
                leftIcon={Lock}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
            rightIcon={ArrowRight}
            className="mt-4"
          >
            Create Free Account
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-surface-800 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-brand-400 hover:text-brand-300 font-bold transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
