import Stripe from 'stripe';

const key = process.env.STRIPE_RESTRICTED_KEY;

export const stripe = key
  ? new Stripe(key, {
      apiVersion: '2025-10-29.clover' as const,
    })
  : null;
