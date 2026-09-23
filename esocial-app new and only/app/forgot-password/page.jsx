'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Something went wrong.');
      sessionStorage.setItem('resetEmail', email.trim().toLowerCase());
      router.push('/reset-password');
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ab">
      <div className="logo">E SOCIAL<small>Boost &amp; buy social media</small></div>
      <form className="card" onSubmit={submit}>
        <h3>Forgot Password?</h3>
        <p className="mu">Enter your email and we will send you a 6-digit code</p>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        <div className="err" style={{ marginTop: 12 }}>{err}</div>
        <button className="btn w" disabled={busy}>{busy ? 'Sending...' : 'Send code'}</button>
      </form>
      <p className="mu" style={{ textAlign: 'center' }}><Link href="/login">Back to Sign In</Link></p>
    </div>
  );
}
