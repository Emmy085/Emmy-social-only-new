'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const N = (n) => '₦' + Number(n).toLocaleString();

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    // Refresh boost progress from the provider first, then load the list.
    api('/api/boost/refresh', { method: 'POST' })
      .catch(() => {})
      .finally(() => api('/api/orders').then((d) => setOrders(d.orders)).catch(() => router.push('/login')));
  }, [router]);

  return (
    <main>
      <div className="crumb">History / Orders</div>
      <div className="card">
        <h3>Orders History</h3>
        {orders === null && <p className="mu">Loading...</p>}
        {orders && orders.length === 0 && <p className="mu">No orders yet.</p>}
        {orders && orders.map((o) => (
          <div className="item" key={o.id}>
            <div className="top">
              <div><b>{o.title}</b><div className="mu">{new Date(o.createdAt).toLocaleString()}</div></div>
              <div><b>{N(o.amount)}</b><br /><span className={'tag ' + (['Failed', 'Canceled'].includes(o.status) ? 's' : 'a')}>{o.status}</span></div>
            </div>
            {o.login && <div className="cred">Email: {o.login.email}<br />Password: {o.login.password}</div>}
          </div>
        ))}
      </div>
    </main>
  );
}
