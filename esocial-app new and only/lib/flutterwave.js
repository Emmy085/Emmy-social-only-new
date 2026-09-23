// Flutterwave Standard (v3). Docs: https://developer.flutterwave.com/docs/collecting-payments/standard
// FLW_SECRET_KEY is your live or test secret key — starts with FLWSECK-. Server only.
const BASE = 'https://api.flutterwave.com/v3';

async function call(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const data = await res.json();
  if (data.status !== 'success') throw new Error(data.message || 'Flutterwave request failed');
  return data.data;
}

// Creates a hosted checkout link. tx_ref must be unique per attempt.
export const initializePayment = ({ tx_ref, amount, email, name, redirect_url }) =>
  call('/payments', {
    method: 'POST',
    body: JSON.stringify({
      tx_ref, amount, currency: 'NGN', redirect_url,
      customer: { email, name },
      customizations: { title: 'E Social', description: 'Wallet funding' },
    }),
  });

// Always re-check with Flutterwave server-side. Never trust amount/status from the redirect URL alone.
export const verifyTransaction = (id) => call(`/transactions/${id}/verify`);
