import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { currentUser } from '@/lib/auth';
import { dec } from '@/lib/crypto';

// Login details are decrypted here, and only for the person who paid.
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const snap = await db.collection('orders').where('email', '==', user.email).get();
  const orders = snap.docs
    .map((d) => {
      const o = d.data();
      return {
        id: d.id, title: o.title, amount: o.amount, status: o.status, createdAt: o.createdAt,
        login: o.cred ? JSON.parse(dec(o.cred)) : null,
      };
    })
    .sort((x, y) => y.createdAt - x.createdAt);
  return NextResponse.json({ orders });
}
