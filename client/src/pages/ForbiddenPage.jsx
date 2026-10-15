import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, Building } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '../components/ui';
import { useOrganization } from '../context/OrganizationContext';
import { ROLE_LABELS } from '../constants/permissions';

export default function ForbiddenPage({ requiredPermission, message }) {
  const navigate = useNavigate();
  const { currentOrganization, currentRole } = useOrganization();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center border-red-500/20 bg-surface-900/90 shadow-2xl">
        <CardContent className="p-8 space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold tracking-widest text-red-400 uppercase">
              403 • Access Restricted
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Access Forbidden
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {message || "You don't have sufficient role permissions to access this workspace section."}
            </p>
          </div>

          {currentOrganization && (
            <div className="p-3.5 rounded-2xl bg-surface-950 border border-surface-800 text-xs space-y-1.5 text-left">
              <div className="flex items-center justify-between text-slate-400">
                <span>Organization:</span>
                <span className="text-white font-semibold">{currentOrganization.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Your Current Role:</span>
                <Badge variant="brand" size="xs">
                  {ROLE_LABELS[currentRole] || currentRole || 'Member'}
                </Badge>
              </div>
              {requiredPermission && (
                <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-surface-800/80">
                  <span>Required Permission:</span>
                  <span className="font-mono text-amber-300 text-[10px]">{requiredPermission}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={ArrowLeft}
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto"
            >
              Go Back
            </Button>
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                leftIcon={Home}
                className="w-full"
              >
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
