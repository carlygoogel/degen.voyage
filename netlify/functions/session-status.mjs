// Verifies a checkout session actually paid before the page credits coins.

export default async (req) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'STRIPE_SECRET_KEY is not configured' }, { status: 500 });
  }
  const id = new URL(req.url).searchParams.get('session_id') || '';
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(id)) {
    return Response.json({ error: 'bad session id' }, { status: 400 });
  }
  const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  const s = await r.json();
  if (s.error) return Response.json({ error: s.error.message }, { status: 502 });
  return Response.json({
    status: s.status,                       // 'complete' once paid
    payment_status: s.payment_status,       // 'paid'
    coins: +((s.metadata && s.metadata.coins) || 0),
  });
};

export const config = { path: '/api/session-status' };
