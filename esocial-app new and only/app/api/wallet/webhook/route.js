import { NextResponse } from 'next/server';
import { creditFunding, verifyWebhookSignature } from '@/lib/walletFunding';

// Set this exact URL in Flutterwave Dashboard -> Settings -> Webhooks, with a secret hash
// (any long random string) in both the dashboard and FLW_WEBHOOK_HASH. This is the reliable
// path — it fires even if the customer closes the tab before the redirect completes.
export async function POST(req) {
  if (!verifyWebhookSignature(req.headers.get('verif-hash'))) {
    return NextResponse.json({ error: 'Bad signature.' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const id = body?.data?.id;
  if (body.event !== 'charge.completed' || !id) return NextResponse.json({ ok: true }); // ignore other events

  try {
    await creditFunding(id);
  } catch (e) {
    console.error('Webhook credit failed:', e.message);
  }
  return NextResponse.json({ ok: true }); // always 200 so Flutterwave doesn't retry-storm
}
