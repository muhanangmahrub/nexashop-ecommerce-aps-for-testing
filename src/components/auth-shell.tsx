import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function AuthShell({ title, subtitle, children, testId }: { title: string; subtitle?: ReactNode; children: ReactNode; testId: string }) {
  return (
    <div className="container flex justify-center py-12" data-testid={testId}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold" data-testid={`${testId}-title`}>
            {title}
          </h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
