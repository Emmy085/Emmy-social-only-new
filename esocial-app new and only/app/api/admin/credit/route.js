import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { isAdmin } from '@/lib/adminSession';

// Testing tool until Flutterwave funding is built: add naira to a user's wallet.
export async function POST(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  const amount = Math.round(Number(b.amount));
  if (!/^[^\s/]+@[^\s/]+\.[^\s/]+$/.test(email) || !(amount > 0)) {
    return NextResponse.json({ error: 'Enter a valid email and amount.' }, { status: 400 });
  }
  const ref = db.collection('users').doc(email);
  try {
    await db.runTransaction(async (t) => {
      const s = await t.get(ref);
      if (!s.exists) throw new Error('NOUSER');
      t.update(ref, { balance: (s.data().balance || 0) + amount });
      t.set(db.collection('transactions').doc(), { email, title: 'Wallet credit (admin)', amount, credit: true, createdAt: Date.now() });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message === 'NOUSER' ? 'No user with that email.' : 'Failed.' }, { status: e.message === 'NOUSER' ? 404 : 500 });
  }
}
