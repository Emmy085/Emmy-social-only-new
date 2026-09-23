'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Verify() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(60);

  useEffect(() => {
    const e = sessionStorage.getItem('signupEmail');
    if (!e) return router.push('/signup');
    setEmail(e);
  }, [router]);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api('/api/verify-signup', { method: 'POST', body: { email, code } });
      sessionStorage.removeItem('signupEmail');
      router.push('/dashboard');
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  }

  return (
    <div className="ab">
      <div className="logo">E SOCIAL<small>Boost &amp; buy social media</small></div>
      <form className="card" onSubmit={submit}>
        <h3>Verify your email</h3>
        <p className="mu">We sent a 6-digit code to <b>{email}</b>. It expires in 10 minutes.</p>
        <label>Enter code</label>
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} inputMode="numeric" maxLength={6} placeholder="123456" autoComplete="one-time-code" required style={{ letterSpacing: 8, fontSize: 22, textAlign: 'center' }} />
        <div className="err" style={{ marginTop: 12 }}>{err}</div>
        <button className="btn w" disabled={busy}>{busy ? 'Verifying...' : 'Verify'}</button>
        <p className="mu" style={{ marginTop: 14 }}>{wait > 0 ? `You can go back and resend in ${wait}s` : 'Didn\u2019t get it? Go back and sign up again to resend.'}</p>
      </form>
    </div>
  );
}
