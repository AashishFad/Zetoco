import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, Building, Edit3, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge, Avatar, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const { currentOrganization, organizations } = useOrganization();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    jobTitle: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile || user) {
      setFormData({
        fullName: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
        username: profile?.username || user?.email?.split('@')[0] || '',
        jobTitle: profile?.job_title || 'Workspace Member',
        bio: profile?.bio || 'Collaborating on Zetoco workspaces.',
      });
    }
  }, [profile, user]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      addToast('Full name is required', 'warning');
      return;
    }

    setSaving(true);
    const res = await updateProfile({
      full_name: formData.fullName.trim(),
      username: formData.username.trim(),
      job_title: formData.jobTitle.trim(),
      bio: formData.bio.trim(),
    });
    setSaving(false);

    if (res.success) {
      addToast('Profile updated successfully!', 'success');
    } else {
      addToast(res.error || 'Failed to update profile', 'error');
    }
  };

  const displayName = formData.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Zetoco User';
  const displayEmail = user?.email || 'user@zetoco.io';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight">
          User Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
          Manage your personal identity, collaborative profile, and active workspace roles.
        </p>
      </div>

      {/* Identity Card */}
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar name={displayName} size="xl" status="online" />
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-bold text-[#F5F5F7]">{displayName}</h2>
                  <Badge variant="brand" size="xs">
                    {currentOrganization?.userRole ? `${currentOrganization.userRole.toUpperCase()} ROLE` : 'MEMBER'}
                  </Badge>
                </div>
                <p className="text-xs text-[#A1A1AA] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {displayEmail}
                </p>
                <p className="text-xs text-[#A1A1AA] flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> {currentOrganization?.name || 'Personal Workspace'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#0B0B0E] border border-[#292930] rounded-2xl flex flex-col items-center justify-center text-center w-full sm:w-auto min-w-[140px]">
              <span className="text-[11px] text-[#71717A] uppercase tracking-wider font-semibold">Organizations</span>
              <span className="text-2xl font-black text-indigo-400 mt-0.5">{organizations.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F5F5F7]">
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <span>Edit Profile Information</span>
          </CardTitle>
          <CardDescription className="text-[#A1A1AA]">
            Updates will be reflected across your organizations, assigned sprint issues, and team member cards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Alex Morgan"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Username
                </label>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. alex_dev"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Job Title / Specialization
                </label>
                <Input
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="e.g. Full Stack Architect"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Email (Supabase Auth ID)
                </label>
                <Input
                  value={displayEmail}
                  disabled
                  className="opacity-70 cursor-not-allowed bg-[#0B0B0E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                Bio / Status Description
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Share a short bio or what you are currently building..."
                className="w-full bg-[#0B0B0E] border border-[#292930] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F5F7] placeholder-[#71717A] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                leftIcon={Save}
                loading={saving}
                disabled={saving}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
