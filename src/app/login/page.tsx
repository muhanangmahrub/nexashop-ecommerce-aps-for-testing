'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiClientError, errorMessage, fieldErrors } from '@/lib/client';
import { validate } from '@/lib/form';
import { loginSchema } from '@/lib/validation';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { toast } from '@/store/toast';
import { AuthShell } from '@/components/auth-shell';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/states';

const OAUTH_ERRORS: Record<string, string> = {
  google_not_configured: 'Google sign-in is not configured on this server.',
  oauth_state_mismatch: 'Google sign-in failed: invalid state. Please try again.',
  oauth_failed: 'Google sign-in failed. Please try again.',
  account_banned: 'Your account has been suspended.',
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect');
  const safeRedirect = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
  const [values, setValues] = useState({ email: '', password: '', rememberMe: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(
    params.get('error') ? (OAUTH_ERRORS[params.get('error')!] ?? 'Sign-in failed') : null,
  );
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrorCode(undefined);
    const v = validate(loginSchema, values);
    if (v.errors) return setErrors(v.errors);
    setErrors({});
    setLoading(true);
    try {
      await api('/api/auth/login', { method: 'POST', body: v.data });
      await useAuthStore.getState().fetchMe();
      const skipped = await useCartStore.getState().mergeGuest().catch(() => []);
      if (skipped.length) toast.warning('Some guest cart items were unavailable');
      await useWishlistStore.getState().load().catch(() => undefined);
      toast.success('Welcome back!');
      router.replace(safeRedirect);
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
      if (err instanceof ApiClientError) setErrorCode(err.code);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your NexaShop account" testId="login-page">
      {params.get('reason') === 'session_expired' && (
        <div className="mb-4 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800" data-testid="login-session-expired">
          Your session has expired. Please log in again.
        </div>
      )}
      {params.get('reset') === 'success' && (
        <div className="mb-4 rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-800" data-testid="login-reset-success">
          Password reset successful. Please log in with your new password.
        </div>
      )}
      {params.get('verified') === '1' && (
        <div className="mb-4 rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-800" data-testid="login-verified-success">
          Email verified! You can now log in.
        </div>
      )}
      <form onSubmit={onSubmit} noValidate className="space-y-4" data-testid="login-form">
        <FormError message={formError} testId="login-error" />
        {errorCode === 'EMAIL_NOT_VERIFIED' && (
          <p className="text-sm">
            Didn&apos;t get the email?{' '}
            <Link href={`/verify-email?email=${encodeURIComponent(values.email)}`} className="text-primary underline" data-testid="login-resend-verification-link">
              Resend verification
            </Link>
          </p>
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
          error={errors.email}
          testId="login-email-input"
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => setValues({ ...values, password: e.target.value })}
          error={errors.password}
          testId="login-password-input"
        />
        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" checked={values.rememberMe} onChange={(e) => setValues({ ...values, rememberMe: e.target.checked })} testId="login-remember-checkbox" />
          <Link href="/forgot-password" className="text-sm text-primary hover:underline" data-testid="login-forgot-password-link">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={loading} data-testid="login-submit-btn">
          Log in
        </Button>
      </form>
      <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
      </div>
      <a href="/api/auth/google">
        <Button variant="outline" className="w-full" data-testid="login-google-btn">
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
          </svg>
          Continue with Google
        </Button>
      </a>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-primary hover:underline" data-testid="login-register-link">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
