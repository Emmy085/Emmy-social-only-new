'use client';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import AdminNav from '@/components/AdminNav';

const N = (n) => '₦' + Number(n).toLocaleString();
const calc = (base, c) => Math.ceil((c.type === 'fixed' ? base + Number(c.value || 0) : base * (1 + Number(c.value || 0) / 100)) * 100) / 100;
const SECTIONS = [
  ['boost', 'Boosting section', 'per 1000'],
  ['numbers', 'Numbers section', 'per number'],
];

export default function AdminProfit() {
  const [cfg, setCfg] = useState(null);
  const [denied, setDenied] = useState(false);
  const [msg, setMsg] = useState({ text: '', good: false });

  useEffect(() => {
    api('/api/admin/session')
      .then(() => api('/api/admin/profit').then(setCfg))
      .catch(() => setDenied(true));
  }, []);

  const set = (k, field) => (e) => setCfg({ ...cfg, [k]: { ...cfg[k], [field]: e.target.value } });

  async function save(e) {
    e.preventDefault();
    try {
      await api('/api/admin/profit', { method: 'PUT', body: cfg });
      setMsg({ text: 'Saved. New prices apply to new orders straight away.', good: true });
    } catch (x) {
      setMsg({ text: x.message, good: false });
    }
  }

  if (denied) notFound();
  if (!cfg) return null;
  return (
    <main>
      <AdminNav />
      <div className="crumb">Admin / Profit Settings</div>
      <form onSubmit={save}>
        {SECTIONS.map(([k, title, unit]) => (
          <div className="card" key={k}>
            <h3>{title}</h3>
            <label>Profit type</label>
            <select value={cfg[k].type} onChange={set(k, 'type')}>
              <option value="percent">Percent on top of provider price</option>
              <option value="fixed">Fixed naira on top ({unit})</option>
            </select>
            <label>{cfg[k].type === 'percent' ? 'Profit (%)' : `Profit (₦ ${unit})`}</label>
            <input type="number" min="0" step="any" value={cfg[k].value} onChange={set(k, 'value')} required />
            <p className="mu">Example: provider charges {N(1000)} {unit}, you charge <b>{N(calc(1000, cfg[k]))}</b> ({N(calc(1000, cfg[k]) - 1000)} profit).</p>
          </div>
        ))}
        <div className="err" style={{ color: msg.good ? 'var(--ok)' : undefined }}>{msg.text}</div>
        <button className="btn w">Save profit settings</button>
      </form>
    </main>
  );
}
