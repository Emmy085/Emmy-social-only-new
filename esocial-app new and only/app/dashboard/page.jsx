'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import AdminTap from '@/components/AdminTap';

const N = (n) => '₦' + Number(n).toLocaleString();

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState(null);

  useEffect(() => { api('/api/me').then(setMe).catch(() => router.push('/login')); }, [router]);
  if (!me) return null;

  return (
    <main>
      <AdminTap>
        <div className="crumb" style={{ fontSize: 20, fontWeight: 700, color: 'var(--pr)' }}>E SOCIAL</div>
      </AdminTap>
      <div className="crumb">Dashboard / Home, {me.name}</div>
      <div className="card row"><div className="g"><small>Wallet Balance</small><b>{N(me.balance)}</b></div></div>
      <div className="card"><Link className="btn w" href="/boost-social-media">Boost Social Media</Link></div>
      <div className="card"><Link className="btn w" href="/buy-social-media">Buy Social Media</Link></div>
      <div className="card"><Link className="btn w" href="/all-countries-numbers">All Countries Numbers</Link></div>
      <div className="card"><Link className="btn w" href="/orders">Orders History</Link></div>
    </main>
  );
}
