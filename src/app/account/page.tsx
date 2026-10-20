'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import type { User } from '@/types';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { validate } from '@/lib/form';
import { profileSchema } from '@/lib/validation';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormError, Spinner } from '@/components/ui/states';
import { Avatar } from '@/components/layout/avatar';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

const MAX_AVATAR = 2 * 1024 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [values, setValues] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) setValues({ name: user.name, email: user.email, phone: user.phone ?? '' });
  }, [user]);

  if (!user) return <Spinner />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const v = validate(profileSchema, values);
    if (v.errors) return setErrors(v.errors);
    setErrors({});
    setSaving(true);
    try {
      setUser(await api<User>('/api/profile', { method: 'PATCH', body: v.data }));
      toast.success('Profile updated successfully');
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file: File | undefined) => {
    setAvatarError(undefined);
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) return setAvatarError('Only JPG, PNG, WEBP and GIF images are allowed');
    if (file.size > MAX_AVATAR) return setAvatarError('Image must be 2MB or smaller');
    const fd = new FormData();
    fd.append('avatar', file);
    setUploading(true);
    try {
      setUser(await api<User>('/api/profile/avatar', { method: 'POST', body: fd }));
      toast.success('Avatar updated');
    } catch (err) {
      setAvatarError(fieldErrors(err).avatar ?? errorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeAvatar = async () => {
    try {
      setUser(await api<User>('/api/profile/avatar', { method: 'DELETE' }));
      toast.success('Avatar removed');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="space-y-6" data-testid="profile-page">
      <Breadcrumbs items={[{ label: 'Account', href: '/account' }, { label: 'Profile' }]} />
      <Card>
        <CardHeader>
          <CardTitle>Profile picture</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Avatar name={user.name} src={user.avatar} size={80} />
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileRef.current?.click()} loading={uploading} data-testid="avatar-upload-btn">
                <Camera className="h-4 w-4" /> Upload new
              </Button>
              {user.avatar && (
                <Button variant="ghost" onClick={removeAvatar} data-testid="avatar-remove-btn">
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => upload(e.target.files?.[0])} data-testid="avatar-file-input" />
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP or GIF. Max 2MB.</p>
            {avatarError && (
              <p className="text-xs text-destructive" role="alert" data-testid="avatar-error">
                {avatarError}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" data-testid="profile-role">{user.role.replace('_', ' ')}</Badge>
            <span>Member since {formatDate(user.createdAt)}</span>
            {user.emailVerified ? <Badge variant="success">Email verified</Badge> : <Badge variant="warning">Email not verified</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} noValidate className="max-w-lg space-y-4" data-testid="profile-form">
            <FormError message={formError} testId="profile-error" />
            <Input label="Full name" required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} error={errors.name} testId="profile-name-input" />
            <Input label="Email" required type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} error={errors.email} testId="profile-email-input" />
            <Input label="Phone" type="tel" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} error={errors.phone} placeholder="+1 555 123 4567" testId="profile-phone-input" />
            <Button type="submit" loading={saving} data-testid="profile-save-btn">
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
