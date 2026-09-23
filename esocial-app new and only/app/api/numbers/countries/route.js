import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getPrices } from '@/lib/fivesim';
import { getProfit, withProfit } from '@/lib/pricing';

// Provider prices are in RUB. RUB_TO_NGN and USD_TO_NGN live in .env.local (update them as rates move).
const rubToNgn = () => Number(process.env.RUB_TO_NGN || 0);

export async function GET(req) {
  if (!(await currentUser())) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const product = new URL(req.url).searchParams.get('product') || 'whatsapp';
  const rate = rubToNgn();
  if (!rate) return NextResponse.json({ error: 'Numbers are unavailable right now. Try again shortly.' }, { status: 503 });

  try {
    const [prices, cfg] = await Promise.all([getPrices(), getProfit()]);
    const countries = Object.entries(prices)
      .filter(([, byProduct]) => byProduct[product])
      .map(([country, byProduct]) => {
        const ops = Object.values(byProduct[product]);
        const cheapest = ops.filter((o) => o.count > 0).sort((a, b) => a.cost - b.cost)[0];
        if (!cheapest) return null;
        return {
          country,
          stock: cheapest.count,
          price: Math.ceil(withProfit(cheapest.cost * rate, cfg.numbers)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.price - b.price);
    return NextResponse.json({ countries, product });
  } catch (e) {
    console.error('5sim prices failed:', e.message);
    return NextResponse.json({ error: 'Numbers are unavailable right now. Try again shortly.' }, { status: 503 });
  }
}
