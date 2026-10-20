'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { validate } from '@/lib/form';
import { forgotPasswordSchema } from '@/lib/validation';
import { AuthShell } from '@/components/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormError, Spinner } from '@/components/ui/states';

function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'idle' | 'verifying' | 'success' | 'error'>(token ? 'verifying' : 'idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [emailError, setEmailError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    api('/api/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => setState('success'))
      .catch((e) => {
        setState('error');
        setMessage(fieldErrors(e).token ?? errorMessage(e));
      });
  }, [token]);

  const resend = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(forgotPasswordSchema, { email });
    if (v.errors) return setEmailError(v.errors.email);
    setEmailError(undefined);
    setLoading(true);
    try {
      await api('/api/auth/resend-verification', { method: 'POST', body: v.data });
      setSent(true);
    } catch (err) {
      setEmailError(fieldErrors(err).email ?? errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (state === 'verifying')
    return (
      <AuthShell title="Verifying your email" testId="verify-email-page">
        <Spinner label="Verifying…" />
      </AuthShell>
    );
  if (state === 'success')
    return (
      <AuthShell title="Email verified!" testId="verify-email-page">
        <div className="flex flex-col items-center gap-4 text-center" data-testid="verify-email-success">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <p className="text-sm">Your email has been verified. You can now log in.</p>
          <Link href="/login?verified=1">
            <Button data-testid="verify-email-login-btn">Go to login</Button>
          </Link>
        </div>
      </AuthShell>
    );

  return (
    <AuthShell title={state === 'error' ? 'Verification failed' : 'Resend verification email'} testId="verify-email-page">
      {state === 'error' && (
        <div className="mb-4 flex flex-col items-center gap-2 text-center" data-testid="verify-email-error">
          <XCircle className="h-12 w-12 text-destructive" />
          <p className="text-sm">{message}</p>
        </div>
      )}
      {sent ? (
        <p className="text-center text-sm text-emerald-600" data-testid="verify-email-resent">
          If your account is unverified, a new link has been sent to {email}.
        </p>
      ) : (
        <form onSubmit={resend} noValidate className="space-y-4" data-testid="resend-verification-form">
          <FormError message={null} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailError} testId="resend-verification-email-input" />
          <Button type="submit" className="w-full" loading={loading} data-testid="resend-verification-submit-btn">
            Send verification link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
