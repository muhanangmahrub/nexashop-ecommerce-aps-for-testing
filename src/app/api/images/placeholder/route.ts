import type { NextRequest } from 'next/server';
import { escapeHtml } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

/** Deterministic SVG placeholder used for seeded product imagery (works offline). */
export function GET(req: NextRequest) {
  const text = escapeHtml((req.nextUrl.searchParams.get('text') ?? 'NexaShop').slice(0, 40));
  const raw = req.nextUrl.searchParams.get('color') ?? '6366f1';
  const color = /^[0-9a-fA-F]{6}$/.test(raw) ? raw : '6366f1';
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 16) {
      lines.push(line.trim());
      line = w;
    } else line += ' ' + w;
  }
  lines.push(line.trim());
  const tspans = lines
    .slice(0, 3)
    .map((l, i) => `<tspan x="400" dy="${i === 0 ? 0 : 60}">${l}</tspan>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#${color}"/><stop offset="1" stop-color="#${color}" stop-opacity="0.55"/></linearGradient></defs>
<rect width="800" height="800" fill="url(#g)"/>
<circle cx="650" cy="150" r="120" fill="#fff" fill-opacity="0.08"/><circle cx="120" cy="680" r="180" fill="#fff" fill-opacity="0.06"/>
<text x="400" y="${400 - (Math.min(lines.length, 3) - 1) * 30}" font-family="Arial,Helvetica,sans-serif" font-size="52" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="middle">${tspans}</text>
</svg>`;
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' },
  });
}
