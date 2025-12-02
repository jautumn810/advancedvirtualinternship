import Stripe from 'stripe';

const key = process.env.STRIPE_RESTRICTED_KEY;

export const stripe = key
  ? new Stripe(key, {
      apiVersion: '2024-06-20',
    })
  : null;
