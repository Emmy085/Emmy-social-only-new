import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebaseAdmin';
import { hmac } from '@/lib/resetCode';

const fail = (error, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const code = String(body.code || '').trim();
  const newPassword = String(body.newPassword || '');

  if (!/^\d{6}$/.test(code) || newPassword.length < 8) {
    return fail('Enter the 6-digit code and a password of at least 8 characters.');
  }

  const resetRef = db.collection('passwordResets').doc(email);
  const userRef = db.collection('users').doc(email);

  try {
    const result = await db.runTransaction(async (t) => {
      const snap = await t.get(resetRef);
      if (!snap.exists) return 'invalid';
      const r = snap.data();

      if (Date.now() > r.expiresAt) { t.delete(resetRef); return 'expired'; }
      if (r.tries >= 5) { t.delete(resetRef); return 'locked'; }

      const a = Buffer.from(hmac(email, code));
      const b = Buffer.from(r.codeHash);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        t.update(resetRef, { tries: r.tries + 1 });
        return 'invalid';
      }

      // Same format as signup: "saltHex:hashHex" (PBKDF2, SHA-256, 100000 rounds)
      const salt = crypto.randomBytes(16);
      const hash = crypto.pbkdf2Sync(newPassword, salt, 100000, 32, 'sha256');
      t.update(userRef, {
        pass: `${salt.toString('hex')}:${hash.toString('hex')}`,
        passwordChangedAt: Date.now(),
      });
      t.delete(resetRef);
      return 'ok';
    });

    if (result === 'ok') return NextResponse.json({ ok: true });
    if (result === 'expired') return fail('That code has expired. Ask for a new one.');
    if (result === 'locked') return fail('Too many wrong tries. Ask for a new code.', 429);
    return fail('Wrong or expired code.');
  } catch (e) {
    return fail('Could not reset your password. Try again.', 500);
  }
}
