import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { currentUser } from '@/lib/auth';
import { smm, getServices } from '@/lib/smm';
import { getProfit, withProfit } from '@/lib/pricing';
import { refundOrder } from '@/lib/refund';

const fail = (error, status) => NextResponse.json({ error }, { status });

export async function POST(req) {
  const user = await currentUser();
  if (!user) return fail('Please sign in.', 401);

  const b = await req.json().catch(() => ({}));
  const serviceId = String(b.service || '');
  const link = String(b.link || '').trim();
  const qty = Math.floor(Number(b.quantity));
  if (!serviceId || !link || link.length > 300 || !(qty > 0)) return fail('Fill in every box correctly.', 400);

  let services, cfg;
  try {
    [services, cfg] = await Promise.all([getServices(), getProfit()]);
  } catch (e) {
    console.error('Provider unavailable:', e.message);
    return fail('Boosting is unavailable right now. Try again shortly.', 503);
  }
  const s = services.find((x) => String(x.service) === serviceId);
  if (!s) return fail('That service is no longer available.', 400);
  if (qty < Number(s.min) || qty > Number(s.max)) return fail(`Quantity must be between ${s.min} and ${s.max}.`, 400);

  const base = Number(s.rate);
  const amount = Math.ceil((withProfit(base, cfg.boost) * qty) / 1000);
  const uRef = db.collection('users').doc(user.email);
  const oRef = db.collection('orders').doc();

  // 1) Take the money and record the order in one step.
  try {
    await db.runTransaction(async (t) => {
      const u = await t.get(uRef);
      const balance = u.data().balance || 0;
      if (balance < amount) throw new Error('FUNDS');
      const now = Date.now();
      t.update(uRef, { balance: balance - amount });
      t.set(oRef, {
        email: user.email, kind: 'boost', title: `${s.name} x${qty}`, amount, cost: (base * qty) / 1000,
        quantity: qty, link, serviceId, status: 'Pending', createdAt: now, refunded: 0,
      });
      t.set(db.collection('transactions').doc(), { email: user.email, title: `Boost: ${s.name}`, amount, credit: false, createdAt: now });
    });
  } catch (e) {
    if (e.message === 'FUNDS') return fail('Insufficient balance. Fund your wallet first.', 402);
    return fail('Could not place your order. Try again.', 500);
  }

  // 2) Send it to the provider. If that fails, give the money back.
  try {
    const r = await smm('add', { service: serviceId, link, quantity: String(qty) });
    if (!r.order) throw new Error('No order id in reply');
    await oRef.update({ providerOrder: String(r.order), status: 'Processing' });
    return NextResponse.json({ ok: true, orderId: oRef.id });
  } catch (e) {
    console.error('Provider order failed:', e.message);
    await refundOrder(oRef.id, amount, 'Failed').catch((x) => console.error('REFUND FAILED', oRef.id, x.message));
    return fail('Could not place your order right now. You were not charged.', 502);
  }
}
