import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Prisma } from '@prisma/client';
import { formatDate, formatPrice } from './utils';
import { SHIPPING_OPTIONS } from './pricing';

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true; user: { select: { name: true; email: true } } } }>;

type ShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

/** Generates a single-page (auto-paginated) PDF invoice for an order. */
export async function generateInvoicePdf(order: OrderWithItems) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 800;
  const indigo = rgb(0.31, 0.27, 0.9);
  const gray = rgb(0.4, 0.4, 0.45);

  const draw = (text: string, x: number, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {}) =>
    page.drawText(text.replace(/[^\x20-\x7E]/g, '?'), {
      x,
      y,
      size: opts.size ?? 10,
      font: opts.bold ? bold : font,
      color: opts.color ?? rgb(0.1, 0.1, 0.1),
    });
  const right = (text: string, xRight: number, opts: { size?: number; bold?: boolean } = {}) => {
    const w = (opts.bold ? bold : font).widthOfTextAtSize(text, opts.size ?? 10);
    draw(text, xRight - w, opts);
  };

  draw('NexaShop', 50, { size: 24, bold: true, color: indigo });
  right('INVOICE', 545, { size: 20, bold: true });
  y -= 22;
  draw('123 Commerce Street, San Francisco, CA 94105', 50, { size: 9, color: gray });
  right(`Invoice #: ${order.orderNumber}`, 545);
  y -= 14;
  right(`Date: ${formatDate(order.createdAt)}`, 545);
  y -= 14;
  right(`Status: ${order.status} / ${order.paymentStatus}`, 545);

  y -= 36;
  const addr = order.shippingAddress as unknown as ShippingAddress;
  draw('Bill To', 50, { bold: true });
  draw('Ship To', 300, { bold: true });
  y -= 14;
  const billLines = [order.user.name, order.user.email];
  const shipLines = [
    addr.fullName,
    addr.line1,
    ...(addr.line2 ? [addr.line2] : []),
    `${addr.city}, ${addr.state} ${addr.postalCode}`,
    addr.country,
    addr.phone,
  ];
  for (let i = 0; i < Math.max(billLines.length, shipLines.length); i++) {
    if (billLines[i]) draw(billLines[i], 50);
    if (shipLines[i]) draw(shipLines[i], 300);
    y -= 13;
  }

  y -= 20;
  page.drawRectangle({ x: 45, y: y - 6, width: 505, height: 22, color: rgb(0.93, 0.93, 0.98) });
  draw('Item', 50, { bold: true });
  right('Qty', 380, { bold: true });
  right('Unit Price', 460, { bold: true });
  right('Total', 545, { bold: true });
  y -= 24;

  for (const item of order.items) {
    if (y < 140) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
    const name = item.name.length > 50 ? `${item.name.slice(0, 47)}...` : item.name;
    draw(name, 50);
    right(String(item.quantity), 380);
    right(formatPrice(Number(item.unitPrice)), 460);
    right(formatPrice(Number(item.unitPrice) * item.quantity), 545);
    if (item.variantName) {
      y -= 12;
      draw(item.variantName, 58, { size: 8, color: gray });
    }
    y -= 18;
  }

  y -= 6;
  page.drawLine({ start: { x: 300, y: y + 8 }, end: { x: 550, y: y + 8 }, thickness: 0.5, color: gray });
  const totals: [string, number][] = [
    ['Subtotal', Number(order.subtotal)],
    [`Shipping (${SHIPPING_OPTIONS[order.shippingMethod].label})`, Number(order.shippingCost)],
    ...(Number(order.discount) > 0
      ? ([[`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, -Number(order.discount)]] as [string, number][])
      : []),
    ['Tax', Number(order.tax)],
  ];
  for (const [label, value] of totals) {
    draw(label, 300);
    right(value < 0 ? `-${formatPrice(-value)}` : formatPrice(value), 545);
    y -= 16;
  }
  draw('Total', 300, { bold: true, size: 12 });
  right(formatPrice(Number(order.total)), 545, { bold: true, size: 12 });

  y = 60;
  draw(`Payment method: ${order.paymentMethod}`, 50, { size: 9, color: gray });
  y -= 12;
  draw('Thank you for shopping with NexaShop!', 50, { size: 9, color: gray });

  return pdf.save();
}
