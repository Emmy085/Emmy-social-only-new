'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

const N = (n) => '₦' + Number(n).toLocaleString();

export default function FundWallet() {
  const router = useRouter();
  const params = useSearchParams();
  const [me, setMe] = useState(null);
  const [amount, setAmount] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/api/me').then(setMe).catch(() => router.push('/login')); }, [router]);

  const status = params.get('status');
  const notice = status === 'failed' ? 'Payment was not completed.'
    : status === 'pending' ? 'Payment received — your wallet updates within a minute. Refresh if it doesn\u2019t.'
    : '';

  async function pay(e) {
    e.preventDefault();
    setErr('');
    const amt = Number(amount);
    if (!(amt >= 100)) return setErr('Minimum funding is \u20a6100.');
    setBusy(true);
    try {
      const { link } = await api('/api/wallet/fund', { method: 'POST', body: { amount: amt } });
      window.location.href = link;
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  }

  return (
    <main>
      <div className="crumb">Dashboard / Fund Wallet</div>
      {me && <div className="card row"><div className="g"><small>Wallet Balance</small><b>{N(me.balance)}</b></div></div>}
      {notice && <div className="card"><p className="mu">{notice}</p></div>}
      <form className="card" onSubmit={pay}>
        <h3>Fund Wallet</h3>
        <label>Amount (\u20a6)</label>
        <input type="number" min="100" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000" required />
        <p className="mu">Pay with card, bank transfer or USSD through Flutterwave.</p>
        <div className="err">{err}</div>
        <button className="btn w" disabled={busy}>{busy ? 'Starting payment...' : 'Pay with Flutterwave'}</button>
      </form>
    </main>
  );
}
