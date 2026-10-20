'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPrice } from '@/lib/utils';

type Point = { period: string; orders: number; revenue: number };

export function SalesChart({ data, metric = 'revenue', height = 300 }: { data: Point[]; metric?: 'revenue' | 'orders'; height?: number }) {
  const color = 'hsl(var(--primary))';
  return (
    <div style={{ width: '100%', height }} data-testid={`sales-chart-${metric}`}>
      <ResponsiveContainer>
        {metric === 'revenue' ? (
          <AreaChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="period" fontSize={11} tickLine={false} stroke="hsl(var(--muted-foreground))" />
            <YAxis fontSize={11} tickLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v: number) => formatPrice(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Area type="monotone" dataKey="revenue" stroke={color} fill="url(#rev)" strokeWidth={2} />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="period" fontSize={11} tickLine={false} stroke="hsl(var(--muted-foreground))" />
            <YAxis fontSize={11} tickLine={false} allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Bar dataKey="orders" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
