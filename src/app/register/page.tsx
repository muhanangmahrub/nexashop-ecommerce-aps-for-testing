'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { validate } from '@/lib/form';
import { registerSchema } from '@/lib/validation';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { toast } from '@/store/toast';
import { AuthShell } from '@/components/auth-shell';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/states';
import { PasswordStrength } from '@/components/ui/password-strength';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect');
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '', acceptTerms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues({ ...values, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const v = validate(registerSchema, values);
    if (v.errors) return setErrors(v.errors);
    setErrors({});
    setLoading(true);
    try {
      const res = await api<{ requiresVerification: boolean }>('/api/auth/register', { method: 'POST', body: v.data });
      if (res.requiresVerification) {
        setPendingEmail(v.data.email);
        return;
      }
      await useAuthStore.getState().fetchMe();
      await useCartStore.getState().mergeGuest().catch(() => []);
      toast.success('Account created successfully!');
      router.replace(redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/');
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (pendingEmail)
    return (
      <AuthShell title="Check your email" testId="register-verify-notice">
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="h-12 w-12 text-primary" />
          <p className="text-sm" data-testid="register-verify-message">
            We sent a verification link to <b>{pendingEmail}</b>. Click the link to activate your account.
          </p>
          <Link href={`/verify-email?email=${encodeURIComponent(pendingEmail)}`} className="text-sm text-primary underline" data-testid="register-resend-link">
            Didn&apos;t receive it? Resend
          </Link>
        </div>
      </AuthShell>
    );

  return (
    <AuthShell title="Create your account" subtitle="Join NexaShop and start shopping" testId="register-page">
      <form onSubmit={onSubmit} noValidate className="space-y-4" data-testid="register-form">
        <FormError message={formError} testId="register-error" />
        <Input label="Full name" required autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} maxLength={50} testId="register-name-input" />
        <Input label="Email" required type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} testId="register-email-input" />
        <Input label="Password" required type="password" autoComplete="new-password" value={values.password} onChange={set('password')} error={errors.password} testId="register-password-input" />
        <PasswordStrength password={values.password} />
        <Input
          label="Confirm password"
          required
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={set('confirmPassword')}
          error={errors.confirmPassword}
          testId="register-confirm-password-input"
        />
        <Checkbox
          label={
            <>
              I agree to the <span className="text-primary underline">Terms &amp; Conditions</span> and <span className="text-primary underline">Privacy Policy</span>
            </>
          }
          checked={values.acceptTerms}
          onChange={set('acceptTerms')}
          error={errors.acceptTerms}
          testId="register-terms-checkbox"
        />
        <Button type="submit" className="w-full" loading={loading} data-testid="register-submit-btn">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline" data-testid="register-login-link">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
