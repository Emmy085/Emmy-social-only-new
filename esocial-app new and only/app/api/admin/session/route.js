import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminSession';

// 200 for the admin, 404 for everyone else, so the admin area looks like it doesn't exist.
export async function GET() {
  return (await isAdmin())
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
