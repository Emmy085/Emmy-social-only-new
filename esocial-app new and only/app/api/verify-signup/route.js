import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebaseAdmin';
import { hmac } from '@/lib/otpCode';
import { setSession } from '@/lib/session';

const fail = (error, status = 400) => NextResponse.json({ error }, { status });

// Step 2 of signup: check the code, create the real user, sign them in.
export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  const code = String(b.code || '').trim();
  if (!/^\d{6}$/.test(code)) return fail('Enter the 6-digit code.');

  const pendingRef = db.collection('pendingSignups').doc(email);
  const userRef = db.collection('users').doc(email);

  try {
    const result = await db.runTransaction(async (t) => {
      const snap = await t.get(pendingRef);
      if (!snap.exists) return 'invalid';
      const p = snap.data();

      if (Date.now() > p.expiresAt) { t.delete(pendingRef); return 'expired'; }
      if (p.tries >= 5) { t.delete(pendingRef); return 'locked'; }

      const a = Buffer.from(hmac(email, code));
      const c = Buffer.from(p.codeHash);
      if (a.length !== c.length || !crypto.timingSafeEqual(a, c)) {
        t.update(pendingRef, { tries: p.tries + 1 });
        return 'invalid';
      }

      if ((await t.get(userRef)).exists) { t.delete(pendingRef); return 'exists'; }

      t.set(userRef, { name: p.name, email: p.email, phone: p.phone, pass: p.pass, balance: 0, createdAt: Date.now() });
      t.delete(pendingRef);
      return 'ok';
    });

    if (result === 'ok') { await setSession(email); return NextResponse.json({ ok: true }); }
    if (result === 'expired') return fail('Code expired. Go back and sign up again.');
    if (result === 'locked') return fail('Too many wrong tries. Go back and sign up again.', 429);
    if (result === 'exists') return fail('That email already has an account. Sign in instead.');
    return fail('Wrong code. Check your email and try again.');
  } catch (e) {
    return fail('Could not verify your code. Try again.', 500);
  }
}
