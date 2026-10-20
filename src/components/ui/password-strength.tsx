'use client';

import { Check, X } from 'lucide-react';
import { PASSWORD_RULES, passwordStrength } from '@/lib/validation';
import { cn } from '@/lib/utils';

const colors = { Weak: 'bg-red-500', Fair: 'bg-amber-500', Good: 'bg-sky-500', Strong: 'bg-emerald-500' };
const labels = ['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number', 'One special character'];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { score, label } = passwordStrength(password);
  return (
    <div className="space-y-2" data-testid="password-strength">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded bg-muted">
          <div className={cn('h-full transition-all', colors[label])} style={{ width: `${(score / 6) * 100}%` }} />
        </div>
        <span className="text-xs font-medium" data-testid="password-strength-label">
          {label}
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-0.5 text-xs sm:grid-cols-2">
        {PASSWORD_RULES.map((r, i) => {
          const ok = r.test(password);
          return (
            <li key={i} className={cn('flex items-center gap-1', ok ? 'text-emerald-600' : 'text-muted-foreground')} data-testid={`password-rule-${i}`} data-met={ok}>
              {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {labels[i]}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
