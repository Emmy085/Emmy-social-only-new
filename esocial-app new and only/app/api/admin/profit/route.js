import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { isAdmin } from '@/lib/adminSession';
import { getProfit } from '@/lib/pricing';

const admin = isAdmin;
const no = () => NextResponse.json({ error: 'Not found.' }, { status: 404 });

export async function GET() {
  if (!(await admin())) return no();
  return NextResponse.json(await getProfit());
}

export async function PUT(req) {
  if (!(await admin())) return no();
  const b = await req.json().catch(() => ({}));
  const clean = (c) => {
    const value = Number(c?.value);
    const type = c?.type;
    if (!['percent', 'fixed'].includes(type) || !Number.isFinite(value) || value < 0) return null;
    if (type === 'percent' && value > 1000) return null;
    if (type === 'fixed' && value > 10_000_000) return null;
    return { type, value };
  };
  const boost = clean(b.boost), numbers = clean(b.numbers);
  if (!boost || !numbers) return NextResponse.json({ error: 'Enter valid profit values.' }, { status: 400 });
  await db.collection('settings').doc('profit').set({ boost, numbers, updatedAt: Date.now() });
  return NextResponse.json({ ok: true });
}
