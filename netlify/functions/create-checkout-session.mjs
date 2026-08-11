// Creates a Stripe Embedded Checkout session for buying Degen Coins.
// Needs STRIPE_SECRET_KEY set in Netlify: Site configuration → Environment variables.
// Zero dependencies — talks to Stripe's REST API directly.

const PRICES = { 1: 100, 5: 500, 10: 1000, 20: 2000 }; // coins → cents, fixed server-side

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'STRIPE_SECRET_KEY is not configured' }, { status: 500 });
  }
  const { coins } = await req.json().catch(() => ({}));
  const cents = PRICES[coins];
  if (!cents) return Response.json({ error: 'bad amount' }, { status: 400 });

  const params = new URLSearchParams({
    mode: 'payment',
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    'metadata[coins]': String(coins),
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(cents),
    'line_items[0][price_data][product_data][name]': `${coins} Degen Coin${coins > 1 ? 's' : ''}`,
  });

  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const s = await r.json();
  if (s.error) return Response.json({ error: s.error.message }, { status: 502 });
  return Response.json({ clientSecret: s.client_secret });
};

export const config = { path: '/api/create-checkout-session' };
