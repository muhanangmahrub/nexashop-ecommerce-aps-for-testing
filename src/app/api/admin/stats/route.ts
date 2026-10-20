import { prisma } from '@/lib/prisma';
import { handler, ok } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { serialize } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  await requireAdmin();
  const since30 = new Date(Date.now() - 30 * 86400_000);
  const [orders, revenue, users, products, recentOrders, statusGroups, lowStock, revenue30, orders30, topProducts] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { total: true } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count(),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { name: true, email: true } } } }),
    prisma.order.groupBy({ by: ['status'], _count: true }),
    prisma.product.findMany({
      where: { stock: { lte: 5 } },
      orderBy: { stock: 'asc' },
      take: 5,
      select: { id: true, name: true, stock: true, sku: true },
    }),
    prisma.order.aggregate({ where: { status: { not: 'CANCELLED' }, createdAt: { gte: since30 } }, _sum: { total: true } }),
    prisma.order.count({ where: { createdAt: { gte: since30 } } }),
    prisma.product.findMany({ orderBy: { soldCount: 'desc' }, take: 5, select: { id: true, name: true, soldCount: true, price: true } }),
  ]);
  return ok(
    serialize({
      totals: {
        orders,
        revenue: Number(revenue._sum.total ?? 0),
        users,
        products,
        revenue30: Number(revenue30._sum.total ?? 0),
        orders30,
      },
      ordersByStatus: statusGroups.map((g) => ({ status: g.status, count: g._count })),
      recentOrders,
      lowStock,
      topProducts,
    }),
  );
});
