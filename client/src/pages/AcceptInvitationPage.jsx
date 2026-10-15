import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogIn,
  UserPlus,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { getInvitationInfo, acceptInvitation } from '../services/invitationService';
import { ROLE_LABELS } from '../constants/permissions';

export default function AcceptInvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();
  const { switchOrganization, fetchOrganizations } = useOrganization();
  const { addToast } = useToast();

  const [inviteInfo, setInviteInfo] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  // Load invitation metadata by raw token
  useEffect(() => {
    if (!token) {
      setError('Missing invitation token.');
      setLoadingInvite(false);
      return;
    }

    getInvitationInfo(token)
      .then((data) => {
        setInviteInfo(data);
        if (data.status === 'revoked') {
          setError('This invitation has been revoked by an organization administrator.');
        } else if (data.status === 'expired' || data.isExpired) {
          setError('This invitation has expired. Please ask an administrator for a new invite.');
        } else if (data.status === 'accepted') {
          setError('This invitation has already been accepted.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Invitation link is invalid or expired.');
      })
      .finally(() => {
        setLoadingInvite(false);
      });
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      addToast('Please sign in or register to accept this invitation', 'warning');
      return;
    }

    const currentEmail = (user?.email || '').trim().toLowerCase();
    const invitedEmail = (inviteInfo?.email || '').trim().toLowerCase();

    if (currentEmail !== invitedEmail) {
      setError(
        `This invitation was issued to ${inviteInfo.email}. You are currently logged in as ${user.email}. Please log in with the invited email address to accept.`
      );
      return;
    }

    setAccepting(true);
    setError('');

    try {
      const res = await acceptInvitation(token);
      setAcceptedSuccess(true);
      addToast(`Joined ${res.organizationName || 'organization'} successfully!`, 'success');

      // Refresh organizations in context
      if (typeof fetchOrganizations === 'function') {
        await fetchOrganizations();
      }

      // Switch active organization if org ID returned
      if (res.organizationId && typeof switchOrganization === 'function') {
        await switchOrganization(res.organizationId);
      }

      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Accept invitation error:', err);
      const msg = err.message || 'Failed to accept invitation. Please try again.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setAccepting(false);
    }
  };

  const userEmail = (user?.email || '').trim().toLowerCase();
  const invitedEmail = (inviteInfo?.email || '').trim().toLowerCase();
  const isEmailMatch = isAuthenticated && userEmail === invitedEmail;

  if (loadingInvite || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-surface-950">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Verifying invitation link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 blur-3xl rounded-full pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 border-surface-800 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center mx-auto mb-3 text-brand-400">
            <Building className="w-8 h-8" />
          </div>

          <CardTitle className="text-xl sm:text-2xl font-extrabold text-white">
            Workspace Invitation
          </CardTitle>
          <CardDescription>
            You have been invited to join{' '}
            <span className="font-semibold text-slate-200">
              {inviteInfo?.organizationName || 'a FlowSync organization'}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-3">
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Accepted Success Banner */}
          {acceptedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-bold text-emerald-200">Welcome to the team!</p>
                <p className="mt-0.5 text-emerald-300/80">
                  You have joined {inviteInfo?.organizationName}. Redirecting to your command center...
                </p>
              </div>
            </div>
          )}

          {/* Invitation Details Summary */}
          {inviteInfo && !acceptedSuccess && (
            <div className="p-4 rounded-2xl bg-surface-900 border border-surface-800 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-surface-800/80">
                <span className="text-slate-400">Organization:</span>
                <span className="font-bold text-white text-sm">
                  {inviteInfo.organizationName}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-surface-800/80">
                <span className="text-slate-400">Invited Email:</span>
                <span className="font-mono text-slate-200">{inviteInfo.email}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-surface-800/80">
                <span className="text-slate-400">Assigned Role:</span>
                <Badge variant="brand" size="xs">
                  {ROLE_LABELS[inviteInfo.role] || inviteInfo.role}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Expires:</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(inviteInfo.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* User Authentication Status */}
          {!acceptedSuccess && (
            <div>
              {!isAuthenticated ? (
                /* Unauthenticated User: Prompt Login or Register */
                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                    <LogIn className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Please log in or register with <strong>{inviteInfo?.email}</strong> to accept this invitation.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Link
                      to={`/login?redirect=/invitations/accept/${token}`}
                      className="w-full"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link
                      to={`/register?redirect=/invitations/accept/${token}`}
                      className="w-full"
                    >
                      <Button size="sm" className="w-full">
                        Register
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : !isEmailMatch ? (
                /* Email Mismatch State */
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                    <p className="font-bold">Email address does not match</p>
                    <p className="text-[11px] text-rose-300/80 leading-relaxed">
                      You are currently signed in as <strong>{user.email}</strong>, but this invitation was sent to{' '}
                      <strong>{inviteInfo?.email}</strong>.
                    </p>
                  </div>

                  <Link to={`/login?redirect=/invitations/accept/${token}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Switch to {inviteInfo?.email}
                    </Button>
                  </Link>
                </div>
              ) : (
                /* Authenticated & Email Matches: Ready to Accept */
                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs flex items-center justify-between">
                    <span>
                      Signed in as <strong>{user.email}</strong>
                    </span>
                    <Badge variant="success" size="xs">
                      Verified Match
                    </Badge>
                  </div>

                  <Button
                    size="md"
                    className="w-full"
                    leftIcon={Sparkles}
                    loading={accepting}
                    disabled={inviteInfo?.status !== 'pending' || inviteInfo?.isExpired}
                    onClick={handleAccept}
                  >
                    Accept Invitation & Join Workspace
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Footer Back Link */}
          <div className="pt-2 text-center text-xs text-slate-500 border-t border-surface-800">
            <Link to="/" className="hover:text-slate-300 transition-colors">
              Return to FlowSync Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
