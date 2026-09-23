import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { currentUser } from '@/lib/auth';

const fail = (error, status) => NextResponse.json({ error }, { status });

export async function POST(req) {
  const user = await currentUser();
  if (!user) return fail('Please sign in.', 401);

  const { id } = await req.json().catch(() => ({}));
  if (!/^[A-Za-z0-9]+$/.test(String(id || ''))) return fail('Invalid account.', 400);

  const aRef = db.collection('accounts').doc(id);
  const uRef = db.collection('users').doc(user.email);
  const oRef = db.collection('orders').doc();

  try {
    await db.runTransaction(async (t) => {
      const [a, u] = await Promise.all([t.get(aRef), t.get(uRef)]);
      if (!a.exists || a.data().status !== 'available') throw new Error('GONE');
      const { price, type, cred } = a.data();
      const balance = u.data().balance || 0;
      if (balance < price) throw new Error('FUNDS');

      const now = Date.now();
      t.update(uRef, { balance: balance - price });
      t.update(aRef, { status: 'sold', buyer: user.email, soldAt: now });
      t.set(oRef, { email: user.email, kind: 'account', title: `${type} account`, amount: price, status: 'Paid', createdAt: now, cred });
      t.set(db.collection('transactions').doc(), { email: user.email, title: `Bought ${type} account`, amount: price, credit: false, createdAt: now });
    });
    return NextResponse.json({ ok: true, orderId: oRef.id });
  } catch (e) {
    if (e.message === 'GONE') return fail('Sorry, that account was just sold.', 409);
    if (e.message === 'FUNDS') return fail('Insufficient balance. Fund your wallet first.', 402);
    return fail('Could not complete the purchase. Try again.', 500);
  }
}
