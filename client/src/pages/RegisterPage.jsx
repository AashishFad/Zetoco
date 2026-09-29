import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Lock, Mail, User, Building, Sparkles } from 'lucide-react';
import { APP_NAME } from '../constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    fullName: 'Aashish Fad',
    email: 'lead.engineer@flowsync.dev',
    workspaceName: 'Acme Product Team',
    password: 'password123',
    confirmPassword: 'password123',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      addToast({
        title: 'Validation Error',
        message: 'Passwords do not match.',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast({
        title: 'Workspace Initialized',
        message: `Welcome to FlowSync, ${formData.fullName}! Workspace "${formData.workspaceName}" ready.`,
        type: 'success',
      });
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-dark-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-elevated relative overflow-hidden">
        {/* Accent Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-600 via-brand-400 to-accent-400"></div>

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create your {APP_NAME} Workspace</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Start collaborating with your team in seconds.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Aashish Fad"
            icon={User}
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />

          <Input
            label="Work Email"
            type="email"
            placeholder="name@company.com"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Workspace / Company Name"
            type="text"
            placeholder="Acme Technologies"
            icon={Building}
            value={formData.workspaceName}
            onChange={(e) => setFormData({ ...formData, workspaceName: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <Button
            type="submit"
            size="md"
            variant="primary"
            isLoading={isLoading}
            rightIcon={ArrowRight}
            className="w-full mt-3"
          >
            Create Workspace Account
          </Button>
        </form>

        {/* Login Footer Link */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
