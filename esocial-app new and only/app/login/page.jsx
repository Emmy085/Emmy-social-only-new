'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import AdminTap from '@/components/AdminTap';

export default function Login() {
  const router = useRouter();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api('/api/login', { method: 'POST', body: f });
      router.push('/dashboard'); // change to your dashboard route
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  }

  return (
    <div className="ab">
      <AdminTap><div className="logo">E SOCIAL<small>Boost &amp; buy social media</small></div></AdminTap>
      <form className="card" onSubmit={submit}>
        <h3>Sign In</h3>
        <p className="mu">Enter your email and password to login</p>
        <label>Email</label>
        <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required />
        <label>Password</label>
        <input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" required />
        <div className="top" style={{ margin: '14px 0' }}><span /><Link href="/forgot-password">Forgot Password?</Link></div>
        <div className="err">{err}</div>
        <button className="btn w" disabled={busy}>{busy ? 'Signing in...' : 'Sign In'}</button>
      </form>
      <p className="mu" style={{ textAlign: 'center' }}>Don&apos;t have an account? <Link href="/signup">Sign Up</Link></p>
    </div>
  );
}
