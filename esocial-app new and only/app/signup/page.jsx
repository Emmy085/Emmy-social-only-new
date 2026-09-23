'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function Signup() {
  const router = useRouter();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (f.password !== f.confirm) return setErr('Passwords do not match.');
    setBusy(true);
    try {
      await api('/api/signup', { method: 'POST', body: f });
      sessionStorage.setItem('signupEmail', f.email.trim().toLowerCase());
      router.push('/verify');
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  }

  return (
    <div className="ab">
      <div className="logo">E SOCIAL<small>Boost &amp; buy social media</small></div>
      <form className="card" onSubmit={submit}>
        <h3>Create your account</h3>
        <p className="mu">Fund your wallet, boost pages and buy accounts in minutes</p>
        <label>Full name</label>
        <input value={f.name} onChange={set('name')} autoComplete="name" required />
        <label>Email</label>
        <input type="email" value={f.email} onChange={set('email')} autoComplete="email" required />
        <label>Phone number</label>
        <input value={f.phone} onChange={set('phone')} placeholder="08012345678" autoComplete="tel" required />
        <label>Password</label>
        <input type="password" value={f.password} onChange={set('password')} autoComplete="new-password" required />
        <label>Confirm password</label>
        <input type="password" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" required />
        <div className="err" style={{ marginTop: 12 }}>{err}</div>
        <button className="btn w" disabled={busy}>{busy ? 'Sending code...' : 'Sign Up'}</button>
      </form>
      <p className="mu" style={{ textAlign: 'center' }}>Already have an account? <Link href="/login">Sign In</Link></p>
    </div>
  );
}
