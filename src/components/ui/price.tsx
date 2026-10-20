import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function Price({ price, compareAt, className, testId = 'product-price' }: { price: number; compareAt?: number | null; className?: string; testId?: string }) {
  const discount = compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-2', className)}>
      <span className="font-semibold" data-testid={testId}>
        {formatPrice(price)}
      </span>
      {discount > 0 && (
        <>
          <span className="text-sm text-muted-foreground line-through" data-testid={`${testId}-compare`}>
            {formatPrice(compareAt!)}
          </span>
          <span className="text-xs font-semibold text-red-600" data-testid={`${testId}-discount`}>
            -{discount}%
          </span>
        </>
      )}
    </span>
  );
}
