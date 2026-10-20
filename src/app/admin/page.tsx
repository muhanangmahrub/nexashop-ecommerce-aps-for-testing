'use client';

import Link from 'next/link';
import { AlertTriangle, DollarSign, Package, ShoppingBag, Users } from 'lucide-react';
import type { Order } from '@/types';
import { useApi } from '@/hooks/use-api';
import { formatDate, formatPrice } from '@/lib/utils';
import { StatCard } from '@/components/admin/stat-card';
import { SalesChart } from '@/components/admin/sales-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatusBadge } from '@/components/account/order-status-badge';

type Stats = {
  totals: { orders: number; revenue: number; users: number; products: number; revenue30: number; orders30: number };
  ordersByStatus: { status: string; count: number }[];
  recentOrders: (Order & { user: { name: string; email: string } })[];
  lowStock: { id: string; name: string; stock: number; sku: string }[];
  topProducts: { id: string; name: string; soldCount: number; price: number }[];
};
type Report = { series: { period: string; orders: number; revenue: number }[] };

export default function AdminDashboard() {
  const { data, loading, error, reload } = useApi<Stats>('/api/admin/stats');
  const report = useApi<Report>('/api/admin/reports/sales?period=daily');

  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {loading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total revenue" value={formatPrice(data.totals.revenue)} icon={DollarSign} hint={`${formatPrice(data.totals.revenue30)} last 30 days`} testId="stat-revenue" />
            <StatCard label="Total orders" value={data.totals.orders} icon={ShoppingBag} hint={`${data.totals.orders30} last 30 days`} testId="stat-orders" />
            <StatCard label="Customers" value={data.totals.users} icon={Users} testId="stat-users" />
            <StatCard label="Products" value={data.totals.products} icon={Package} testId="stat-products" />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Revenue — last 30 days</CardTitle>
              </CardHeader>
              <CardContent>{report.data ? <SalesChart data={report.data.series} /> : <Skeleton className="h-[300px]" />}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Orders by status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2" data-testid="orders-by-status">
                {data.ordersByStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between text-sm">
                    <OrderStatusBadge status={s.status as Order['status']} />
                    <span className="font-semibold">{s.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recent orders</CardTitle>
                <Link href="/admin/orders" className="text-sm text-primary hover:underline" data-testid="dashboard-view-all-orders">
                  View all
                </Link>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="recent-orders-table">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2">Order</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((o) => (
                      <tr key={o.id} className="border-t">
                        <td className="py-2">
                          <Link href={`/admin/orders/${o.id}`} className="font-mono text-primary hover:underline" data-testid="dashboard-recent-order-link">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td>{o.user.name}</td>
                        <td>{formatDate(o.createdAt)}</td>
                        <td>
                          <OrderStatusBadge status={o.status} />
                        </td>
                        <td className="text-right">{formatPrice(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" /> Stock alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2" data-testid="dashboard-stock-alerts">
                {data.lowStock.length === 0 && <p className="text-sm text-muted-foreground">All products are well stocked.</p>}
                {data.lowStock.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="truncate pr-2">{p.name}</span>
                    <span className={p.stock === 0 ? 'font-semibold text-destructive' : 'font-semibold text-amber-600'}>{p.stock}</span>
                  </div>
                ))}
                <Link href="/admin/inventory" className="block pt-2 text-sm text-primary hover:underline" data-testid="dashboard-manage-inventory">
                  Manage inventory
                </Link>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Top selling products</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-1 text-sm" data-testid="top-products">
                {data.topProducts.map((p, i) => (
                  <li key={p.id} className="flex justify-between">
                    <span>
                      {i + 1}. {p.name}
                    </span>
                    <span className="text-muted-foreground">{p.soldCount} sold</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
