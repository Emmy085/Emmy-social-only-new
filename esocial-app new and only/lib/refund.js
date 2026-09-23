import { db } from './firebaseAdmin';

// Gives money back to the buyer at most once per naira, then sets the order status.
export async function refundOrder(orderId, want, status) {
  const oRef = db.collection('orders').doc(orderId);
  await db.runTransaction(async (t) => {
    const o = await t.get(oRef);
    const d = o.data();
    const uRef = db.collection('users').doc(d.email);
    const u = await t.get(uRef);
    const amt = Math.min(want, d.amount) - (d.refunded || 0);
    if (amt > 0) {
      t.update(uRef, { balance: (u.data().balance || 0) + amt });
      t.set(db.collection('transactions').doc(), {
        email: d.email, title: 'Refund: ' + d.title, amount: amt, credit: true, createdAt: Date.now(),
      });
    }
    t.update(oRef, { status, refunded: (d.refunded || 0) + Math.max(amt, 0) });
  });
}
