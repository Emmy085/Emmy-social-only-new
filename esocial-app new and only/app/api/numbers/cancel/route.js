import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { currentUser } from '@/lib/auth';
import { cancelNumber } from '@/lib/fivesim';
import { refundOrder } from '@/lib/refund';

// Lets a buyer give up on a number early and get a refund, same as 5sim's own cancel window.
export async function POST(req) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const { orderId } = await req.json().catch(() => ({}));
  const ref = db.collection('orders').doc(String(orderId || ''));
  const snap = await ref.get();
  if (!snap.exists || snap.data().email !== user.email) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  try {
    await cancelNumber(snap.data().providerOrder);
    await refundOrder(ref.id, snap.data().amount, 'Canceled');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Too late to cancel. A code may already be on its way.' }, { status: 409 });
  }
}
