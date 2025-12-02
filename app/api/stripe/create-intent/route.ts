import { NextResponse } from 'next/server';

import { stripe } from '@/lib/stripe';

interface CreateIntentBody {
  amount: number;
  currency?: string;
}

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as CreateIntentBody;

    if (!body?.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'A positive numeric amount (in the smallest currency unit) is required.' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.trunc(body.amount),
      currency: body.currency ?? 'usd',
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret }, { status: 200 });
  } catch (error) {
    console.error('Error creating payment intent', error);
    return NextResponse.json({ error: 'Unable to create payment intent.' }, { status: 500 });
  }
}
