import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { isAdmin } from '@/lib/adminSession';
import { enc } from '@/lib/crypto';

const TYPES = ['Instagram', 'Facebook', 'TikTok', 'X (Twitter)', 'Snapchat', 'YouTube', 'Telegram'];
const admin = isAdmin;
const no = () => NextResponse.json({ error: 'Not found.' }, { status: 404 });

// Admin list: no login details, ever. Passwords are write-only after upload.
export async function GET() {
  if (!(await admin())) return no();
  const snap = await db.collection('accounts').get();
  const accounts = snap.docs
    .map((d) => {
      const a = d.data();
      return { id: d.id, type: a.type, price: a.price, description: a.description, status: a.status, createdAt: a.createdAt };
    })
    .sort((x, y) => y.createdAt - x.createdAt);
  return NextResponse.json({ accounts });
}

export async function POST(req) {
  if (!(await admin())) return no();
  const b = await req.json().catch(() => ({}));
  const price = Math.round(Number(b.price));
  const description = String(b.description || '').trim();
  const email = String(b.email || '').trim();
  const password = String(b.password || '');
  if (!TYPES.includes(b.type) || !(price > 0) || !description || description.length > 500 || !email || !password) {
    return NextResponse.json({ error: 'Fill in every box correctly.' }, { status: 400 });
  }
  const ref = await db.collection('accounts').add({
    type: b.type, price, description, status: 'available', createdAt: Date.now(),
    cred: enc(JSON.stringify({ email, password })), // encrypted at rest
  });
  return NextResponse.json({ ok: true, id: ref.id });
}

export async function DELETE(req) {
  if (!(await admin())) return no();
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!/^[A-Za-z0-9]+$/.test(id)) return NextResponse.json({ error: 'Invalid account.' }, { status: 400 });
  const ref = db.collection('accounts').doc(id);
  const done = await db.runTransaction(async (t) => {
    const s = await t.get(ref);
    if (!s.exists || s.data().status !== 'available') return false;
    t.delete(ref);
    return true;
  });
  return done
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'Only unsold accounts can be deleted.' }, { status: 409 });
}
