import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  let database: 'up' | 'down' = 'up';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'down';
  }
  const healthy = database === 'up';
  return NextResponse.json(
    {
      success: healthy,
      status: healthy ? 'ok' : 'degraded',
      services: { database },
      testMode: config.testMode,
      maintenanceMode: config.maintenanceMode,
      uptimeSeconds: Math.round(process.uptime()),
      responseTimeMs: Date.now() - started,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
    },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
