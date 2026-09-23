'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const N = (n) => '₦' + Number(n).toLocaleString();

export default function BoostSocialMedia() {
  const router = useRouter();
  const [services, setServices] = useState(null);
  const [me, setMe] = useState(null);
  const [cat, setCat] = useState('');
  const [sid, setSid] = useState('');
  const [link, setLink] = useState('');
  const [qty, setQty] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/me').then(setMe).catch(() => router.push('/login'));
    api('/api/boost/services')
      .then((d) => { setServices(d.services); setCat(d.services[0]?.category || ''); })
      .catch((e) => { setServices([]); setErr(e.message); });
  }, [router]);

  const cats = useMemo(() => [...new Set((services || []).map((s) => s.category))], [services]);
  const inCat = (services || []).filter((s) => s.category === cat);
  const s = (services || []).find((x) => x.id === sid);
  const total = s && Number(qty) > 0 ? Math.ceil((s.price * Number(qty)) / 1000) : 0;

  async function order(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api('/api/boost/order', { method: 'POST', body: { service: sid, link, quantity: Number(qty) } });
      router.push('/orders');
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  }

  return (
    <main>
      <div className="crumb">Dashboard / Boost Social Media</div>
      {me && <div className="card row"><div className="g"><small>Wallet Balance</small><b>{N(me.balance)}</b></div><Link className="btn" href="/fund-wallet">Recharge</Link></div>}
      <form className="card" onSubmit={order}>
        <h3>New boost order</h3>
        {services === null && <p className="mu">Loading services...</p>}
        <label>Category</label>
        <select value={cat} onChange={(e) => { setCat(e.target.value); setSid(''); }}>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label>Service</label>
        <select value={sid} onChange={(e) => setSid(e.target.value)} required>
          <option value="">Choose a service</option>
          {inCat.map((x) => <option key={x.id} value={x.id}>{x.name} - {N(x.price)} per 1000</option>)}
        </select>
        <label>Link or username</label>
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://instagram.com/yourpage" maxLength={300} required />
        <label>Quantity{s ? ` (${s.min} to ${s.max})` : ''}</label>
        <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min={s?.min} max={s?.max} required />
        <p>Total: <b>{N(total)}</b></p>
        <div className="err">{err}</div>
        <button className="btn w" disabled={busy || !s}>{busy ? 'Placing order...' : 'Place order'}</button>
      </form>
    </main>
  );
}
