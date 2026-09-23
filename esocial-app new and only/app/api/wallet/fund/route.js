import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { initializePayment } from '@/lib/flutterwave';

// Starts a Flutterwave checkout. The amount here is only a suggestion to Flutterwave's
// hosted page — creditFunding() re-reads the REAL paid amount from Flutterwave afterwards.
export async function POST(req) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const { amount } = await req.json().catch(() => ({}));
  const amt = Math.floor(Number(amount));
  if (!(amt >= 100)) return NextResponse.json({ error: 'Minimum funding is \u20a6100.' }, { status: 400 });

  const tx_ref = `esocial-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const origin = req.headers.get('origin') || process.env.APP_URL;

  try {
    const data = await initializePayment({
      tx_ref, amount: amt, email: user.email, name: user.name,
      redirect_url: `${origin}/api/wallet/callback`,
    });
    return NextResponse.json({ link: data.link });
  } catch (e) {
    console.error('Flutterwave init failed:', e.message);
    return NextResponse.json({ error: 'Could not start payment. Try again.' }, { status: 502 });
  }
}
