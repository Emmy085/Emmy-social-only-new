'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const N = (n) => '₦' + Number(n).toLocaleString();

export default function AllCountriesNumbers() {
  const router = useRouter();
  const [product, setProduct] = useState('');
  const [products, setProducts] = useState(null);
  const [countries, setCountries] = useState(null);
  const [me, setMe] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => { api('/api/me').then(setMe).catch(() => router.push('/login')); }, [router]);
  useEffect(() => {
    api('/api/numbers/products')
      .then((d) => { setProducts(d.products); setProduct(d.products.includes('whatsapp') ? 'whatsapp' : d.products[0] || ''); })
      .catch((e) => { setProducts([]); setErr(e.message); });
  }, []);
  useEffect(() => {
    if (!product) return;
    setCountries(null);
    api('/api/numbers/countries?product=' + product).then((d) => setCountries(d.countries)).catch((e) => { setCountries([]); setErr(e.message); });
  }, [product]);

  async function buy(country) {
    setErr('');
    setBusy(country);
    try {
      await api('/api/numbers/order', { method: 'POST', body: { country, product } });
      router.push('/orders');
    } catch (e) {
      setErr(e.message);
      setBusy('');
    }
  }

  return (
    <main>
      <div className="crumb">Dashboard / All Countries Numbers</div>
      {me && <div className="card row"><div className="g"><small>Wallet Balance</small><b>{N(me.balance)}</b></div><Link className="btn" href="/fund-wallet">Recharge</Link></div>}
      <div className="card">
        <h3>Buy a number</h3>
        <label>Service</label>
        <select value={product} onChange={(e) => setProduct(e.target.value)} disabled={!products || !products.length}>
          {products === null && <option>Loading services...</option>}
          {products && products.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {err && <div className="err">{err}</div>}
        {countries === null && <p className="mu">Loading countries...</p>}
        {countries && countries.length === 0 && <p className="mu">No numbers in stock for this service right now.</p>}
        {countries && countries.map((c) => (
          <div className="item top" key={c.country}>
            <div><b>{c.country}</b><div className="mu">{c.stock} available</div></div>
            <button className="btn" disabled={!!busy} onClick={() => buy(c.country)}>
              {busy === c.country ? 'Buying...' : `Buy ${N(c.price)}`}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
