'use client';

import { useState } from 'react';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { validate } from '@/lib/form';
import { changePasswordSchema } from '@/lib/validation';
import { toast } from '@/store/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/states';
import { PasswordStrength } from '@/components/ui/password-strength';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

const empty = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function SecurityPage() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const v = validate(changePasswordSchema, values);
    if (v.errors) return setErrors(v.errors);
    setErrors({});
    setLoading(true);
    try {
      await api('/api/profile/password', { method: 'PATCH', body: v.data });
      toast.success('Password updated successfully');
      setValues(empty);
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="security-page">
      <Breadcrumbs items={[{ label: 'Account', href: '/account' }, { label: 'Security' }]} />
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} noValidate className="max-w-lg space-y-4" data-testid="change-password-form">
            <FormError message={formError} testId="change-password-error" />
            <Input label="Current password" type="password" value={values.currentPassword} onChange={(e) => setValues({ ...values, currentPassword: e.target.value })} error={errors.currentPassword} testId="current-password-input" />
            <Input label="New password" type="password" value={values.newPassword} onChange={(e) => setValues({ ...values, newPassword: e.target.value })} error={errors.newPassword} testId="new-password-input" />
            <PasswordStrength password={values.newPassword} />
            <Input label="Confirm new password" type="password" value={values.confirmPassword} onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })} error={errors.confirmPassword} testId="confirm-new-password-input" />
            <Button type="submit" loading={loading} data-testid="change-password-submit-btn">
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
