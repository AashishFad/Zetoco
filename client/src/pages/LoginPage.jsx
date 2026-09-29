import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Lock, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { APP_NAME } from '../constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState('recruiter@flowsync.dev');
  const [password, setPassword] = useState('demo1234');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast({
        title: 'Demo Sign In Successful',
        message: 'Welcome to FlowSync! Redirecting to the workspace dashboard...',
        type: 'success',
      });
      navigate('/dashboard');
    }, 600);
  };

  const handleFillDemo = () => {
    setEmail('recruiter@flowsync.dev');
    setPassword('demo1234');
    addToast({
      title: 'Demo Credentials Loaded',
      message: 'Email & password filled for rapid recruiter demonstration.',
      type: 'info',
    });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-dark-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-elevated relative overflow-hidden">
        {/* Accent Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-600 via-brand-400 to-accent-400"></div>

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Sign in to {APP_NAME}</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Welcome back! Access your collaborative workspace.
          </p>
        </div>

        {/* Quick Demo Autofill Pill */}
        <div className="mb-6 p-3 rounded-2xl bg-brand-950/40 border border-brand-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold text-white">Recruiter Demo Mode</p>
              <p className="text-[11px] text-slate-400">One-click instant login credentials</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleFillDemo}>
            Autofill
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() =>
                  addToast({
                    title: 'Password Recovery (Demo)',
                    message: 'Password reset link sent to demo email address.',
                    type: 'info',
                  })
                }
                className="text-[11px] text-brand-400 hover:text-brand-300 font-medium hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            size="md"
            variant="primary"
            isLoading={isLoading}
            rightIcon={ArrowRight}
            className="w-full mt-2"
          >
            Sign In to Workspace
          </Button>
        </form>

        {/* Register Footer Link */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            Don't have a workspace?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-bold hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
