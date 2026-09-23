import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebaseAdmin';
import { setAdminSession } from '@/lib/adminSession';

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const same = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

// Password-only admin login. The password lives in ADMIN_PASSWORD on the server, never in the browser.
// 5 wrong tries from one IP address locks that IP out for 15 minutes.
export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const ref = db.collection('adminAttempts').doc(crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32));
  const d = (await ref.get()).data() || { count: 0, lockedUntil: 0 };

  if (d.lockedUntil > Date.now()) {
    return NextResponse.json({ error: 'Too many tries. Try again later.' }, { status: 429 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== 'string' || !same(password, expected)) {
    const count = (d.count || 0) + 1;
    await ref.set(count >= 5 ? { count: 0, lockedUntil: Date.now() + 15 * 60_000 } : { count, lockedUntil: 0 });
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }

  await ref.delete().catch(() => {});
  await setAdminSession();
  return NextResponse.json({ ok: true });
}
