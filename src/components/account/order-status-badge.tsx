import type { OrderStatus, PaymentStatus } from '@/types';
import { Badge } from '@/components/ui/badge';

const ORDER: Record<OrderStatus, 'warning' | 'info' | 'default' | 'success' | 'danger'> = {
  PENDING: 'warning',
  PROCESSING: 'info',
  SHIPPED: 'default',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};
const PAYMENT: Record<PaymentStatus, 'warning' | 'success' | 'secondary' | 'danger'> = {
  UNPAID: 'warning',
  PAID: 'success',
  REFUNDED: 'secondary',
  FAILED: 'danger',
};

export function OrderStatusBadge({ status, testId = 'order-status-badge' }: { status: OrderStatus; testId?: string }) {
  return (
    <Badge variant={ORDER[status]} data-testid={testId} data-status={status}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={PAYMENT[status]} data-testid="payment-status-badge" data-status={status}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
