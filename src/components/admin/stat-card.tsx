import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function StatCard({ label, value, icon: Icon, hint, testId }: { label: string; value: string | number; icon: LucideIcon; hint?: string; testId: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="flex items-center gap-4 pt-5">
        <span className="rounded-lg bg-primary/10 p-3 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold" data-testid={`${testId}-value`}>
            {value}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
