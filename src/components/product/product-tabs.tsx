'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ProductTabs({ description, specs }: { description: string; specs: Record<string, string> }) {
  const [tab, setTab] = useState<'description' | 'specs'>('description');
  const entries = Object.entries(specs ?? {});
  return (
    <div className="mt-10" data-testid="product-tabs">
      <div className="flex gap-6 border-b" role="tablist">
        {(['description', 'specs'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn('-mb-px border-b-2 pb-2 text-sm font-medium capitalize', tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')} data-testid={`product-tab-${t}`}>
            {t === 'specs' ? 'Specifications' : 'Description'}
          </button>
        ))}
      </div>
      <div className="py-5" role="tabpanel">
        {tab === 'description' ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground" data-testid="product-description">
            {description}
          </p>
        ) : entries.length ? (
          <table className="w-full max-w-xl text-sm" data-testid="product-specs">
            <tbody>
              {entries.map(([k, v]) => (
                <tr key={k} className="border-b">
                  <th className="w-1/3 py-2 text-left font-medium">{k}</th>
                  <td className="py-2 text-muted-foreground">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground">No specifications available.</p>
        )}
      </div>
    </div>
  );
}
