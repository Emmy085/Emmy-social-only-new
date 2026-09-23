import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebaseAdmin';
import { hmac } from '@/lib/resetCode';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  // Same reply whether or not the account exists, so nobody can probe for emails.
  const ok = NextResponse.json({ ok: true });

  const user = await db.collection('users').doc(email).get();
  if (!user.exists) return ok;

  const ref = db.collection('passwordResets').doc(email);
  const old = await ref.get();
  if (old.exists && Date.now() - old.data().createdAt < 60_000) return ok; // 60s cooldown

  const code = crypto.randomInt(100000, 1000000);
  await ref.set({
    codeHash: hmac(email, code),
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60_000,
    tries: 0,
  });

  try {
    const res = await fetch(process.env.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, name: user.data().name, type: 'reset' }),
    });
    if (!res.ok) console.error('Google Script replied with status', res.status);
  } catch (e) {
    console.error('Google Script request failed:', e.message);
  }

  return ok;
}
