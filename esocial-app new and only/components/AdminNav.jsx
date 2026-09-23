'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AdminNav() {
  const router = useRouter();
  async function out() {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
  }
  return (
    <div className="card top" style={{ alignItems: 'center' }}>
      <div><Link href="/admin/social-media">Accounts</Link> · <Link href="/admin/profit">Profit</Link></div>
      <button type="button" className="btn o" onClick={out}>Sign out</button>
    </div>
  );
}
