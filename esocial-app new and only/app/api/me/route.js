import { NextResponse } from 'next/server';
import { currentUser, isAdminEmail } from '@/lib/auth';

export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  return NextResponse.json({
    name: u.name,
    email: u.email,
    balance: u.balance || 0,
    isAdmin: isAdminEmail(u.email),
  });
}
