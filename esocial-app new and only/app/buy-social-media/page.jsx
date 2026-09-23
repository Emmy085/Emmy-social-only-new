'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const N = (n) => '₦' + Number(n).toLocaleString();

export default function BuySocialMedia() {
  const router = useRouter();
  const [list, setList] = useState(null);
  const [me, setMe] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');

  const load = () => api('/api/accounts').then((d) => setList(d.accounts)).catch((e) => setMsg(e.message));
  useEffect(() => {
    api('/api/me').then(setMe).catch(() => router.push('/login'));
    load();
  }, [router]);

  async function buy(id) {
    setMsg('');
    setBusy(id);
    try {
      await api('/api/buy', { method: 'POST', body: { id } });
      router.push('/orders');
    } catch (e) {
      setMsg(e.message);
      setBusy('');
      if (e.status === 409) load();
    }
  }

  return (
    <main>
      <div className="crumb">Dashboard / Buy Social Media</div>
      {me && <div className="card row"><div className="g"><small>Wallet Balance</small><b>{N(me.balance)}</b></div><Link className="btn" href="/fund-wallet">Recharge</Link></div>}
      <div className="card">
        <h3>Available accounts</h3>
        {msg && <div className="err">{msg}</div>}
        {list === null && <p className="mu">Loading...</p>}
        {list && list.length === 0 && <p className="mu">No accounts in stock right now. Check back soon.</p>}
        {list && list.map((a) => (
          <div className="item" key={a.id}>
            <div className="top">
              <div><span className="tag">{a.type}</span><p style={{ margin: '8px 0' }}>{a.description}</p></div>
              <b>{N(a.price)}</b>
            </div>
            <div className="lock">🔒 Email and password unlock after payment.</div>
            <button className="btn w" style={{ marginTop: 10 }} disabled={!!busy} onClick={() => buy(a.id)}>
              {busy === a.id ? 'Processing...' : `Buy for ${N(a.price)}`}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
