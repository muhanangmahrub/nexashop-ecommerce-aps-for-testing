'use client';

import { useState } from 'react';
import { Ban, LockOpen, ShieldCheck } from 'lucide-react';
import type { PageMeta, Role } from '@/types';
import { useApi } from '@/hooks/use-api';
import { useDebounce } from '@/hooks/use-debounce';
import { api, errorMessage } from '@/lib/client';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Input, inputClass } from '@/components/ui/input';
import { Avatar } from '@/components/layout/avatar';

type Row = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  isBanned: boolean;
  bannedReason: string | null;
  emailVerified: string | null;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  _count: { orders: number };
};

export default function AdminUsersPage() {
  const me = useAuthStore((s) => s.user);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [banning, setBanning] = useState<Row | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const dq = useDebounce(q, 350);
  const qs = new URLSearchParams({ page: String(page), ...(dq && { q: dq }), ...(role && { role }), ...(status && { status }) });
  const { data, loading, error, reload } = useApi<{ items: Row[]; meta: PageMeta }>(`/api/admin/users?${qs}`);

  const patch = async (u: Row, body: Record<string, unknown>, msg: string) => {
    setBusy(true);
    try {
      await api(`/api/admin/users/${u.id}`, { method: 'PATCH', body });
      toast.success(msg);
      reload();
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const isSuper = me?.role === 'SUPER_ADMIN';
  const locked = (u: Row) => u.lockedUntil && new Date(u.lockedUntil) > new Date();

  return (
    <div className="space-y-4" data-testid="admin-users-page">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="grid gap-2 sm:grid-cols-3">
        <input value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} placeholder="Search name or email" className={inputClass} data-testid="admin-users-search" aria-label="Search users" />
        <select value={role} onChange={(e) => (setRole(e.target.value), setPage(1))} className={inputClass} data-testid="admin-users-role-filter" aria-label="Role">
          <option value="">All roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super admin</option>
        </select>
        <select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))} className={inputClass} data-testid="admin-users-status-filter" aria-label="Status">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="locked">Locked</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>
      {loading && !data ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.items.length ? (
        <EmptyState title="No users found" testId="admin-users-empty" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm" data-testid="admin-users-table">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Joined</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id} className="border-t" data-testid="admin-user-row" data-user-email={u.email}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.name} src={u.avatar} size={32} />
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground" data-testid="admin-user-email">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    {isSuper && u.id !== me?.id ? (
                      <select
                        value={u.role}
                        disabled={busy}
                        onChange={(e) => patch(u, { role: e.target.value }, `Role updated to ${e.target.value}`)}
                        className="h-8 rounded border border-input bg-background px-1 text-xs"
                        data-testid="admin-user-role-select"
                        aria-label={`Role for ${u.email}`}
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super admin</option>
                      </select>
                    ) : (
                      <Badge variant="secondary" data-testid="admin-user-role">{u.role.replace('_', ' ')}</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {u.isBanned ? <Badge variant="danger" data-testid="admin-user-status">Banned</Badge> : <Badge variant="success" data-testid="admin-user-status">Active</Badge>}
                      {locked(u) && <Badge variant="warning">Locked</Badge>}
                      {!u.emailVerified && <Badge variant="outline">Unverified</Badge>}
                    </div>
                  </td>
                  <td className="p-3">{u._count.orders}</td>
                  <td className="p-3">{formatDate(u.createdAt)}</td>
                  <td className="p-3">
                    {u.id !== me?.id && (
                      <div className="flex justify-end gap-1">
                        {locked(u) && (
                          <Button size="sm" variant="outline" onClick={() => patch(u, { unlock: true }, 'Account unlocked')} data-testid="admin-user-unlock-btn">
                            <LockOpen className="h-3.5 w-3.5" /> Unlock
                          </Button>
                        )}
                        {u.isBanned ? (
                          <Button size="sm" variant="outline" onClick={() => patch(u, { isBanned: false }, `${u.name} has been unbanned`)} data-testid="admin-user-unban-btn">
                            <ShieldCheck className="h-3.5 w-3.5" /> Unban
                          </Button>
                        ) : (
                          <Button size="sm" variant="destructive" onClick={() => (setBanning(u), setReason(''))} data-testid="admin-user-ban-btn">
                            <Ban className="h-3.5 w-3.5" /> Ban
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} testId="admin-users-pagination" />}
      <Modal
        open={Boolean(banning)}
        onClose={() => setBanning(null)}
        title={`Ban ${banning?.name}?`}
        testId="ban-user-dialog"
        footer={
          <>
            <Button variant="outline" onClick={() => setBanning(null)} data-testid="ban-user-cancel">
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={busy}
              onClick={async () => {
                if (banning && (await patch(banning, { isBanned: true, bannedReason: reason || null }, `${banning.name} has been banned`))) setBanning(null);
              }}
              data-testid="ban-user-confirm"
            >
              Ban user
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-muted-foreground">The user will be logged out and unable to sign in.</p>
        <Input label="Reason (optional)" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} testId="ban-reason-input" />
      </Modal>
    </div>
  );
}
