import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { currentUser } from '@/lib/auth';
import { checkNumber } from '@/lib/fivesim';
import { refundOrder } from '@/lib/refund';

// 5sim statuses: PENDING, RECEIVED, CANCELED, TIMEOUT, FINISHED, BANNED
const MAP = { RECEIVED: 'Code received', FINISHED: 'Completed', CANCELED: 'Canceled', TIMEOUT: 'Expired', BANNED: 'Number banned' };
const REFUND_ON = ['CANCELED', 'TIMEOUT', 'BANNED'];
const FINAL = ['Completed', 'Canceled', 'Expired', 'Number banned'];

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const snap = await db.collection('orders').where('email', '==', user.email).get();
  const open = snap.docs.filter((d) => { const o = d.data(); return o.kind === 'number' && o.providerOrder && !FINAL.includes(o.status); });

  for (const d of open) {
    try {
      const o = d.data();
      const r = await checkNumber(o.providerOrder);
      const code = (r.sms || [])[0]?.code;
      if (REFUND_ON.includes(r.status)) await refundOrder(d.id, o.amount, MAP[r.status] || r.status);
      else await d.ref.update({ status: MAP[r.status] || r.status, code: code || null });
    } catch (e) {
      console.error('5sim check failed:', d.id, e.message);
    }
  }
  return NextResponse.json({ ok: true });
}
