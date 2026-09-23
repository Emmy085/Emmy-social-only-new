import crypto from 'crypto';
import { db } from './firebaseAdmin';
import { verifyTransaction } from './flutterwave';

// Idempotent: safe to call twice for the same transaction_id (webhook + redirect can both fire).
// Returns { ok: true, alreadyCredited } or throws.
export async function creditFunding(transactionId) {
  const v = await verifyTransaction(transactionId);
  if (v.status !== 'successful' || v.currency !== 'NGN') throw new Error('Payment not successful.');

  const fundRef = db.collection('walletFundings').doc(String(transactionId));
  return db.runTransaction(async (t) => {
    const existing = await t.get(fundRef);
    if (existing.exists) return { ok: true, alreadyCredited: true };

    const email = String(v.customer?.email || '').trim().toLowerCase();
    const amount = Math.floor(Number(v.amount));
    if (!email || !(amount > 0)) throw new Error('Bad payment data from Flutterwave.');

    const uRef = db.collection('users').doc(email);
    const u = await t.get(uRef);
    if (!u.exists) throw new Error('No matching user for this payment.');

    t.set(fundRef, { email, amount, tx_ref: v.tx_ref, createdAt: Date.now() });
    t.update(uRef, { balance: (u.data().balance || 0) + amount });
    t.set(db.collection('transactions').doc(), { email, title: 'Wallet funding (Flutterwave)', amount, credit: true, createdAt: Date.now() });
    return { ok: true, alreadyCredited: false, email, amount };
  });
}

export const verifyWebhookSignature = (headerHash) => {
  const expected = process.env.FLW_WEBHOOK_HASH || '';
  const a = Buffer.from(String(headerHash || ''));
  const b = Buffer.from(expected);
  return expected && a.length === b.length && crypto.timingSafeEqual(a, b);
};
