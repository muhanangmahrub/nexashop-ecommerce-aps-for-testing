'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { validate } from '@/lib/form';
import { resetPasswordSchema } from '@/lib/validation';
import { AuthShell } from '@/components/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/states';
import { PasswordStrength } from '@/components/ui/password-strength';
import { toast } from '@/store/toast';

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [values, setValues] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token)
    return (
      <AuthShell title="Invalid reset link" testId="reset-password-page">
        <div className="space-y-4 text-center" data-testid="reset-password-invalid">
          <p className="text-sm text-muted-foreground">This password reset link is missing or invalid.</p>
          <Link href="/forgot-password">
            <Button data-testid="reset-password-request-new">Request a new link</Button>
          </Link>
        </div>
      </AuthShell>
    );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const v = validate(resetPasswordSchema, { ...values, token });
    if (v.errors) return setErrors(v.errors);
    setErrors({});
    setLoading(true);
    try {
      await api('/api/auth/reset-password', { method: 'POST', body: v.data });
      toast.success('Password reset successfully');
      router.push('/login?reset=success');
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      setFormError(fe.token ?? errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Set a new password" testId="reset-password-page">
      <form onSubmit={onSubmit} noValidate className="space-y-4" data-testid="reset-password-form">
        <FormError message={formError} testId="reset-password-error" />
        <Input label="New password" type="password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} error={errors.password} testId="reset-password-input" />
        <PasswordStrength password={values.password} />
        <Input
          label="Confirm new password"
          type="password"
          value={values.confirmPassword}
          onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })}
          error={errors.confirmPassword}
          testId="reset-password-confirm-input"
        />
        <Button type="submit" className="w-full" loading={loading} data-testid="reset-password-submit-btn">
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
