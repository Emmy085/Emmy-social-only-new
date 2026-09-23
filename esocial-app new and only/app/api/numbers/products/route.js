import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getProducts } from '@/lib/fivesim';

// Every service your 5sim key actually sells — nothing hardcoded on the site's side.
export async function GET() {
  if (!(await currentUser())) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  try {
    return NextResponse.json({ products: await getProducts() });
  } catch (e) {
    console.error('products failed:', e.message);
    return NextResponse.json({ error: 'Numbers are unavailable right now.' }, { status: 503 });
  }
}
