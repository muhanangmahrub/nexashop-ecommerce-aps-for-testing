import Stripe from 'stripe';
import { config } from './config';

let client: Stripe | null = null;

export function stripeEnabled() {
  return Boolean(config.stripeSecretKey) && !config.testMode;
}

export function getStripe() {
  if (!config.stripeSecretKey) throw new Error('Stripe is not configured');
  if (!client) client = new Stripe(config.stripeSecretKey);
  return client;
}
