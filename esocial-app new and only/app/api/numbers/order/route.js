import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { currentUser } from '@/lib/auth';
import { getPrices, buyNumber } from '@/lib/fivesim';
import { getProfit, withProfit } from '@/lib/pricing';

const fail = (error, status) => NextResponse.json({ error }, { status });
const rubToNgn = () => Number(process.env.RUB_TO_NGN || 0);

export async function POST(req) {
  const user = await currentUser();
  if (!user) return fail('Please sign in.', 401);

  const b = await req.json().catch(() => ({}));
  const country = String(b.country || '');
  const product = String(b.product || 'whatsapp');
  if (!country) return fail('Choose a country.', 400);

  const rate = rubToNgn();
  if (!rate) return fail('Numbers are unavailable right now. Try again shortly.', 503);

  let prices, cfg;
  try {
    [prices, cfg] = await Promise.all([getPrices(), getProfit()]);
  } catch (e) {
    return fail('Numbers are unavailable right now. Try again shortly.', 503);
  }
  const ops = Object.values(prices?.[country]?.[product] || {});
  const cheapest = ops.filter((o) => o.count > 0).sort((a, b) => a.cost - b.cost)[0];
  if (!cheapest) return fail('That number just went out of stock. Pick another country.', 409);
  const amount = Math.ceil(withProfit(cheapest.cost * rate, cfg.numbers));

  const uRef = db.collection('users').doc(user.email);
  const oRef = db.collection('orders').doc();

  // 1) Take the money and record a pending order.
  try {
    await db.runTransaction(async (t) => {
      const u = await t.get(uRef);
      const balance = u.data().balance || 0;
      if (balance < amount) throw new Error('FUNDS');
      const now = Date.now();
      t.update(uRef, { balance: balance - amount });
      t.set(oRef, { email: user.email, kind: 'number', title: `${product} number (${country})`, amount, status: 'Pending', createdAt: now, refunded: 0 });
      t.set(db.collection('transactions').doc(), { email: user.email, title: `Number: ${product} (${country})`, amount, credit: false, createdAt: now });
    });
  } catch (e) {
    return fail(e.message === 'FUNDS' ? 'Insufficient balance. Fund your wallet first.' : 'Could not place your order. Try again.', e.message === 'FUNDS' ? 402 : 500);
  }

  // 2) Buy it from 5sim. If that fails, refund.
  try {
    const r = await buyNumber(country, product);
    await oRef.update({ providerOrder: String(r.id), phone: r.phone, expiresAt: r.expires, status: 'Waiting for SMS' });
    return NextResponse.json({ ok: true, orderId: oRef.id });
  } catch (e) {
    console.error('5sim buy failed:', e.message);
    const { refundOrder } = await import('@/lib/refund');
    await refundOrder(oRef.id, amount, 'Failed').catch((x) => console.error('REFUND FAILED', oRef.id, x.message));
    return fail('Could not get a number right now. You were not charged.', 502);
  }
}
