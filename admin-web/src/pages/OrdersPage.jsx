import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listOrders, ApiError } from '../services/api';
import { RequirePermission } from '../components/RequireAuth';
export default function OrdersPage() {
    return (<RequirePermission permission="orders:read">
      <OrdersInner />
    </RequirePermission>);
}
function OrdersInner() {
    const [rows, setRows] = useState([]);
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setLoading(true);
        listOrders({ status: status || undefined, limit: 50 })
            .then((res) => setRows(res.data || []))
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load orders'))
            .finally(() => setLoading(false));
    }, [status]);
    return (<div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium">Orders</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-stone-200 rounded-lg text-sm px-3 py-1.5 bg-white">
          <option value="">All statuses</option>
          {['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'].map((s) => (<option key={s} value={s}>
                {s}
              </option>))}
        </select>
      </div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {loading ? (<p className="text-stone-400 text-sm">Loading…</p>) : (<div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs text-stone-500 uppercase">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (<tr key={o.id} className="border-t border-stone-100 hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link to={`/orders/${o.id}`} className="text-stone-900 underline-offset-2 hover:underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status}/>
                  </td>
                  <td className="px-4 py-3">
                    ₹{Number(o.grand_total).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {o.created_at ? new Date(o.created_at).toLocaleString() : '—'}
                  </td>
                </tr>))}
              {!rows.length && (<tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-stone-400">
                    No orders found
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>)}
    </div>);
}
export function StatusBadge({ status }) {
    return (<span className="inline-flex px-2 py-0.5 rounded text-xs bg-stone-100 text-stone-700">
      {status}
    </span>);
}
