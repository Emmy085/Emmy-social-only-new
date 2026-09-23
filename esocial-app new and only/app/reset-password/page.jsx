'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState({ text: '', ok: false });
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(60); // resend cooldown, matches the server

  useEffect(() => { setEmail(sessionStorage.getItem('resetEmail') || ''); }, []);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function post(url, data) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Something went wrong.');
    return d;
  }

  async function submit(e) {
    e.preventDefault();
    if (pw.length < 8) return setMsg({ text: 'Password must be at least 8 characters.', ok: false });
    if (pw !== pw2) return setMsg({ text: 'Passwords do not match.', ok: false });
    setBusy(true);
    try {
      await post('/api/reset-password', { email, code, newPassword: pw });
      sessionStorage.removeItem('resetEmail');
      setMsg({ text: 'Password changed. Taking you to Sign In...', ok: true });
      setTimeout(() => router.push('/login'), 1500);
    } catch (x) {
      setMsg({ text: x.message, ok: false });
      setBusy(false);
    }
  }

  async function resend(ev) {
    ev.preventDefault();
    if (wait > 0) return;
    try {
      await post('/api/forgot-password', { email });
      setWait(60);
      setMsg({ text: 'If that email has an account, a new code is on its way.', ok: true });
    } catch (x) {
      setMsg({ text: x.message, ok: false });
    }
  }

  return (
    <div className="ab">
      <div className="logo">E SOCIAL<small>Boost &amp; buy social media</small></div>
      <form className="card" onSubmit={submit}>
        <h3>Reset Password</h3>
        <p className="mu">Enter the 6-digit code from your email and choose a new password. The code expires in 10 minutes.</p>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <label>Code</label>
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} inputMode="numeric" maxLength={6} placeholder="123456" autoComplete="one-time-code" required style={{ letterSpacing: 8, fontSize: 22, textAlign: 'center' }} />
        <label>New password</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required />
        <label>Confirm new password</label>
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required />
        <div className="err" style={{ marginTop: 12, color: msg.ok ? 'var(--ok)' : undefined }}>{msg.text}</div>
        <button className="btn w" disabled={busy}>{busy ? 'Saving...' : 'Reset password'}</button>
        <div className="top" style={{ marginTop: 14 }}>
          <a href="#" onClick={resend}>{wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}</a>
          <Link href="/login">Back to Sign In</Link>
        </div>
      </form>
    </div>
  );
}
