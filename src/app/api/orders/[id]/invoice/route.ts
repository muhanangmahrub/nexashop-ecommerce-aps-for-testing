import { prisma } from '@/lib/prisma';
import { errors, handler } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { generateInvoicePdf } from '@/lib/invoice';
import { isAdminRole } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export const GET = handler(async (_req, { params }) => {
  const user = await requireUser();
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, user: { select: { name: true, email: true } } },
  });
  if (!order || (order.userId !== user.id && !isAdminRole(user.role))) throw errors.notFound('Order not found');
  if (order.status === 'CANCELLED') throw errors.unprocessable('Invoices are not available for cancelled orders');
  const pdf = await generateInvoicePdf(order);
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
});
