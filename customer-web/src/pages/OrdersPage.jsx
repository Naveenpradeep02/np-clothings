import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { listMyOrders, ApiError } from '../services/api';
export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const [rows, setRows] = useState([]);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!user)
            return;
        listMyOrders()
            .then((res) => setRows(res.data || []))
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load orders'));
    }, [user]);
    if (authLoading) {
        return (<Layout>
        <p className="p-12 text-center text-stone-400 text-sm">Loading…</p>
      </Layout>);
    }
    if (!user)
        return <Navigate to="/login" replace state={{ from: '/account/orders' }}/>;
    return (<Layout>
      <Seo title="Orders" noindex/>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/account" className="text-xs text-stone-500">
          ← Account
        </Link>
        <h1 className="text-2xl font-light tracking-wide mt-2 mb-8">Orders</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="space-y-3">
          {rows.map((o) => (<Link key={o.id} to={`/account/orders/${o.id}`} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-4 hover:border-stone-400">
              <div>
                <p className="font-medium">{o.order_number}</p>
                <p className="text-xs text-stone-400">
                  {o.created_at ? new Date(o.created_at).toLocaleDateString() : ''} · {o.status}
                </p>
              </div>
              <p className="text-sm">₹{Number(o.grand_total).toLocaleString('en-IN')}</p>
            </Link>))}
          {!rows.length && !error && (<p className="text-stone-400 text-sm">No orders yet. <Link to="/shop" className="underline">Shop</Link></p>)}
        </div>
      </div>
    </Layout>);
}
