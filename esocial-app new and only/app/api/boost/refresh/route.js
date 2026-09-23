import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { currentUser } from '@/lib/auth';
import { smm } from '@/lib/smm';
import { refundOrder } from '@/lib/refund';

const FINAL = ['Completed', 'Canceled', 'Partial', 'Failed'];

// Pulls the latest status from the provider for this user's open boost orders.
export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const snap = await db.collection('orders').where('email', '==', user.email).get();
  const open = snap.docs
    .filter((d) => { const o = d.data(); return o.kind === 'boost' && o.providerOrder && !FINAL.includes(o.status); })
    .slice(0, 100);
  if (!open.length) return NextResponse.json({ ok: true });

  try {
    const res = await smm('status', { orders: open.map((d) => d.data().providerOrder).join(',') });
    for (const d of open) {
      const o = d.data();
      const r = res[o.providerOrder];
      if (!r || r.error) continue;
      const st = String(r.status || '');
      const low = st.toLowerCase();
      if (low === 'completed') await d.ref.update({ status: 'Completed' });
      else if (low.startsWith('cancel')) await refundOrder(d.id, o.amount, 'Canceled');
      else if (low === 'partial') {
        const remains = Math.min(Math.max(0, Number(r.remains) || 0), o.quantity);
        await refundOrder(d.id, Math.floor((o.amount * remains) / o.quantity), 'Partial');
      } else if (st && st !== o.status) await d.ref.update({ status: st });
    }
  } catch (e) {
    console.error('Status refresh failed:', e.message);
  }
  return NextResponse.json({ ok: true });
}
