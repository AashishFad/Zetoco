import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, User, Mail, Lock, Building, Sparkles } from 'lucide-react';
import { Input, Button, Badge, useToast } from '../components/ui';
import { APP_NAME } from '../constants';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast(`Workspace "${workspaceName || 'Demo'}" created! (UI Simulation)`, 'success');
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
            Create your Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            Get started with {APP_NAME} in less than 2 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Aashish"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={User}
            required
          />

          <Input
            label="Work Email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={Mail}
            required
          />

          <Input
            label="Workspace / Company Name"
            placeholder="e.g. Acme Innovations"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            leftIcon={Building}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={Lock}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={Lock}
              required
            />
          </div>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            rightIcon={ArrowRight}
            className="mt-4"
          >
            Create Free Account
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-surface-800 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
