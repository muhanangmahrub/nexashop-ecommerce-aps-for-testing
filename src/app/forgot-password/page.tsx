'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { validate } from '@/lib/form';
import { forgotPasswordSchema } from '@/lib/validation';
import { AuthShell } from '@/components/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/states';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const v = validate(forgotPasswordSchema, { email });
    if (v.errors) return setError(v.errors.email);
    setError(undefined);
    setLoading(true);
    try {
      await api('/api/auth/forgot-password', { method: 'POST', body: v.data });
      setSent(true);
    } catch (err) {
      setError(fieldErrors(err).email);
      setFormError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link" testId="forgot-password-page">
      {sent ? (
        <div className="flex flex-col items-center gap-3 text-center" data-testid="forgot-password-success">
          <MailCheck className="h-12 w-12 text-primary" />
          <p className="text-sm">If an account exists for <b>{email}</b>, a password reset link has been sent.</p>
          <Link href="/login" className="text-sm text-primary underline" data-testid="forgot-password-back-to-login">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4" data-testid="forgot-password-form">
          <FormError message={formError} testId="forgot-password-error" />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} testId="forgot-password-email-input" />
          <Button type="submit" className="w-full" loading={loading} data-testid="forgot-password-submit-btn">
            Send reset link
          </Button>
          <p className="text-center text-sm">
            <Link href="/login" className="text-primary hover:underline" data-testid="forgot-password-login-link">
              Back to login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
