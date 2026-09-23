'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// Wrap your logo with this. Tap it 5 times, each tap within 1.5 seconds of the last, to open the hidden admin password box.
export default function AdminTap({ children }) {
  const router = useRouter();
  const taps = useRef({ n: 0, t: 0 });
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function tap() {
    const now = Date.now();
    const cur = taps.current;
    taps.current = now - cur.t > 1500 ? { n: 1, t: now } : { n: cur.n + 1, t: now };
    if (taps.current.n >= 5) {
      taps.current = { n: 0, t: 0 };
      setOpen(true);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api('/api/admin/login', { method: 'POST', body: { password: pw } });
      router.push('/admin/social-media');
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  }

  return (
    <>
      <div onClick={tap} style={{ userSelect: 'none', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
        {children}
      </div>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 50, display: 'grid', placeItems: 'center', padding: 16 }} onClick={() => setOpen(false)}>
          <form className="card" style={{ width: '100%', maxWidth: 340, margin: 0 }} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h3>Admin</h3>
            <input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" autoComplete="off" required />
            <div className="err" style={{ marginTop: 10 }}>{err}</div>
            <button className="btn w" disabled={busy}>{busy ? 'Checking...' : 'Enter'}</button>
          </form>
        </div>
      )}
    </>
  );
}
