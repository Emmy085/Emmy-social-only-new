import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { currentUser } from '@/lib/auth';

// Public listing for signed-in buyers. Login details are never included here.
export async function GET() {
  if (!(await currentUser())) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const snap = await db.collection('accounts').where('status', '==', 'available').get();
  const accounts = snap.docs
    .map((d) => {
      const a = d.data();
      return { id: d.id, type: a.type, price: a.price, description: a.description, createdAt: a.createdAt };
    })
    .sort((x, y) => y.createdAt - x.createdAt);
  return NextResponse.json({ accounts });
}
