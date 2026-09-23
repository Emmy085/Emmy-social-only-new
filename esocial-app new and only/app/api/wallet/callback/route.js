import { NextResponse } from 'next/server';
import { creditFunding } from '@/lib/walletFunding';

// Flutterwave redirects the browser here after checkout. This is a convenience path for
// the person who just paid — the webhook below is the one source of truth for crediting.
export async function GET(req) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const transactionId = url.searchParams.get('transaction_id');
  const base = process.env.APP_URL || url.origin;

  if (status !== 'successful' || !transactionId) {
    return NextResponse.redirect(`${base}/fund-wallet?status=failed`);
  }
  try {
    await creditFunding(transactionId);
    return NextResponse.redirect(`${base}/dashboard?funded=1`);
  } catch (e) {
    console.error('Callback credit failed:', e.message);
    return NextResponse.redirect(`${base}/fund-wallet?status=pending`);
  }
}
