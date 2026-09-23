import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getServices } from '@/lib/smm';
import { getProfit, withProfit } from '@/lib/pricing';

// Buyers only ever see your price (provider rate + your profit), never the provider rate.
export async function GET() {
  if (!(await currentUser())) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  try {
    const [list, cfg] = await Promise.all([getServices(), getProfit()]);
    const services = list
      .map((s) => ({
        id: String(s.service), name: s.name, category: s.category || 'Other',
        min: Number(s.min), max: Number(s.max), price: withProfit(Number(s.rate), cfg.boost),
      }))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return NextResponse.json({ services });
  } catch (e) {
    console.error('Services failed:', e.message);
    return NextResponse.json({ error: 'Boosting is unavailable right now. Try again shortly.' }, { status: 503 });
  }
}
