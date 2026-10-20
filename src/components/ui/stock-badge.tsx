import type { StockStatus } from '@/types';
import { Badge } from './badge';

export function StockBadge({ status, stock, testId = 'stock-indicator' }: { status: StockStatus; stock?: number; testId?: string }) {
  if (status === 'OUT_OF_STOCK')
    return (
      <Badge variant="danger" data-testid={testId} data-status={status}>
        Out of Stock
      </Badge>
    );
  if (status === 'LOW_STOCK')
    return (
      <Badge variant="warning" data-testid={testId} data-status={status}>
        Low Stock{stock !== undefined ? ` — only ${stock} left` : ''}
      </Badge>
    );
  return (
    <Badge variant="success" data-testid={testId} data-status={status}>
      In Stock
    </Badge>
  );
}
