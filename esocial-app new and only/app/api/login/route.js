import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebaseAdmin';
import { setSession } from '@/lib/session';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  let ok = false;
  if (/^[^\s/]+@[^\s/]+\.[^\s/]+$/.test(email) && password) {
    const snap = await db.collection('users').doc(email).get();
    const stored = snap.exists ? snap.data().pass : '';
    if (typeof stored === 'string' && stored.includes(':')) {
      // Same "saltHex:hashHex" format used by signup and reset-password
      const [salt, hash] = stored.split(':');
      const a = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 32, 'sha256');
      const b = Buffer.from(hash, 'hex');
      ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    }
  }
  if (!ok) return NextResponse.json({ error: 'Wrong email or password.' }, { status: 401 });

  await setSession(email);
  return NextResponse.json({ ok: true });
}
