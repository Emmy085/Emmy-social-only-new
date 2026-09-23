'use client';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import AdminNav from '@/components/AdminNav';

const TYPES = ['Instagram', 'Facebook', 'TikTok', 'X (Twitter)', 'Snapchat', 'YouTube', 'Telegram'];
const N = (n) => '₦' + Number(n).toLocaleString();
const blank = { type: 'Instagram', price: '', description: '', email: '', password: '' };

export default function AdminSocialMedia() {
  const [ok, setOk] = useState(false);
  const [denied, setDenied] = useState(false);
  const [list, setList] = useState([]);
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState({ text: '', good: false });
  const [credit, setCredit] = useState({ email: '', amount: '' });

  const load = () => api('/api/admin/accounts').then((d) => setList(d.accounts));
  useEffect(() => {
    api('/api/admin/session')
      .then(() => { setOk(true); return load(); })
      .catch(() => setDenied(true));
  }, []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const say = (text, good = false) => setMsg({ text, good });

  async function add(e) {
    e.preventDefault();
    try {
      await api('/api/admin/accounts', { method: 'POST', body: f });
      setF(blank);
      say('Account added. Buyers can see it now.', true);
      load();
    } catch (x) { say(x.message); }
  }
  async function del(id) {
    try { await api('/api/admin/accounts?id=' + id, { method: 'DELETE' }); load(); }
    catch (x) { say(x.message); }
  }
  async function addCredit(e) {
    e.preventDefault();
    try {
      await api('/api/admin/credit', { method: 'POST', body: credit });
      setCredit({ email: '', amount: '' });
      say('Wallet credited.', true);
    } catch (x) { say(x.message); }
  }

  if (denied) notFound();
  if (!ok) return null;
  return (
    <main>
      <AdminNav />
      <div className="crumb">Admin / Social Media Upload</div>
      <div className="err" style={{ color: msg.good ? 'var(--ok)' : undefined }}>{msg.text}</div>

      <form className="card" onSubmit={add}>
        <h3>Upload a social media account</h3>
        <label>Type of account</label>
        <select value={f.type} onChange={set('type')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <label>Amount (₦)</label>
        <input type="number" min="1" value={f.price} onChange={set('price')} placeholder="3500" required />
        <label>Description</label>
        <textarea rows={3} maxLength={500} value={f.description} onChange={set('description')} placeholder="Followers, niche, age, extras" required />
        <label>Account email</label>
        <input value={f.email} onChange={set('email')} placeholder="Hidden from buyers until they pay" autoComplete="off" required />
        <label>Account password</label>
        <input type="password" value={f.password} onChange={set('password')} placeholder="Stored encrypted. You can't view it again." autoComplete="new-password" required />
        <button className="btn w" style={{ marginTop: 14 }}>Add account</button>
      </form>

      <div className="card">
        <h3>Uploaded accounts ({list.length})</h3>
        {list.map((a) => (
          <div className="item" key={a.id}>
            <div className="top">
              <div>
                <span className="tag">{a.type}</span> <span className={'tag ' + (a.status === 'sold' ? 's' : 'a')}>{a.status === 'sold' ? 'Sold' : 'Available'}</span>
                <p style={{ margin: '8px 0' }}>{a.description}</p>
              </div>
              <b>{N(a.price)}</b>
            </div>
            {a.status === 'available' && <button type="button" className="btn d" onClick={() => del(a.id)}>Delete</button>}
          </div>
        ))}
      </div>

      <form className="card" onSubmit={addCredit}>
        <h3>Credit a wallet (testing)</h3>
        <p className="mu">Temporary tool until Flutterwave funding is built.</p>
        <label>User email</label>
        <input type="email" value={credit.email} onChange={(e) => setCredit({ ...credit, email: e.target.value })} required />
        <label>Amount (₦)</label>
        <input type="number" min="1" value={credit.amount} onChange={(e) => setCredit({ ...credit, amount: e.target.value })} required />
        <button className="btn w" style={{ marginTop: 14 }}>Add to wallet</button>
      </form>
    </main>
  );
}
