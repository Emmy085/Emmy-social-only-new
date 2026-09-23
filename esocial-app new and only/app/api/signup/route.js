import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebaseAdmin';
import { hmac } from '@/lib/otpCode';

const fail = (error, status = 400) => NextResponse.json({ error }, { status });

// Step 1 of signup: validate, check the email is free, email a 6-digit code. No account yet.
export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const phone = String(b.phone || '').trim();
  const password = String(b.password || '');

  if (name.length < 2) return fail('Enter your full name.');
  if (!/^[^\s/]+@[^\s/]+\.[^\s/]+$/.test(email)) return fail('Enter a valid email address.');
  if (!/^0\d{10}$/.test(phone)) return fail('Enter an 11-digit phone number, like 08012345678.');
  if (password.length < 8) return fail('Password must be at least 8 characters.');

  const userRef = db.collection('users').doc(email);
  if ((await userRef.get()).exists) return fail('That email already has an account. Sign in instead.');

  const pendingRef = db.collection('pendingSignups').doc(email);
  const old = await pendingRef.get();
  if (old.exists && Date.now() - old.data().createdAt < 60_000) return NextResponse.json({ ok: true }); // 60s cooldown, same reply

  const code = crypto.randomInt(100000, 1000000);
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  await pendingRef.set({
    name, email, phone,
    pass: `${salt.toString('hex')}:${hash.toString('hex')}`, // same format login/reset expect
    codeHash: hmac(email, code),
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60_000,
    tries: 0,
  });

  await fetch(process.env.GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, name, type: 'signup' }),
  }).catch((e) => console.error('Google Script request failed:', e.message));

  return NextResponse.json({ ok: true });
}
