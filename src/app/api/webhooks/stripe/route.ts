import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { fail } from '@/lib/api';
import { config } from '@/lib/config';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!config.stripeSecretKey || !config.stripeWebhookSecret) return fail(400, 'Stripe webhooks are not configured');
  const sig = req.headers.get('stripe-signature');
  if (!sig) return fail(400, 'Missing stripe-signature header');
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), sig, config.stripeWebhookSecret);
  } catch {
    return fail(400, 'Invalid webhook signature');
  }
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent;
    await prisma.order.updateMany({ where: { paymentIntentId: pi.id }, data: { paymentStatus: 'FAILED' } });
  }
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    if (typeof charge.payment_intent === 'string')
      await prisma.order.updateMany({ where: { paymentIntentId: charge.payment_intent }, data: { paymentStatus: 'REFUNDED' } });
  }
  return Response.json({ received: true });
}
