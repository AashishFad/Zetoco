import React from 'react';
import { User, Mail, Shield, CheckCircle2, Award } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export default function ProfilePage() {
  const { addToast } = useToast();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          User Profile
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Personal developer details, active sprint badges, and account security.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <Avatar name="Aashish Fad" status="online" size="xl" />
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl font-extrabold text-white">Aashish Fad</h2>
              <p className="text-xs text-slate-400">Lead Full-Stack Software Engineer</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <Badge variant="brand" size="sm">
                  Workspace Owner
                </Badge>
                <Badge variant="accent" size="sm">
                  Full-Stack
                </Badge>
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Display Name" defaultValue="Aashish Fad" />
            <Input label="Email Address" defaultValue="aashish.fad@flowsync.dev" disabled />
            <Input label="Title / Specialization" defaultValue="Full-Stack Developer" />
            <Input label="Timezone" defaultValue="UTC+05:30 (IST)" />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                addToast({
                  title: 'Profile Updated',
                  message: 'Developer profile saved.',
                  type: 'success',
                })
              }
            >
              Update Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
