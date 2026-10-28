import { useEffect, useState } from 'react';
import { listCoupons, ApiError } from '../services/api';
import { RequirePermission } from '../components/RequireAuth';
export default function CouponsPage() {
    return (<RequirePermission permission="coupons:read">
      <CouponsInner />
    </RequirePermission>);
}
function CouponsInner() {
    const [rows, setRows] = useState([]);
    const [error, setError] = useState(null);
    useEffect(() => {
        listCoupons({ limit: '50' })
            .then((res) => setRows(res.data || []))
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load coupons'));
    }, []);
    return (<div>
      <h1 className="text-lg font-medium mb-6">Coupons</h1>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-xs text-stone-500 uppercase text-left">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Uses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (<tr key={c.id} className="border-t border-stone-100">
                <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">
                  {c.discount_type === 'percentage'
                ? `${c.discount_value}%`
                : `₹${c.discount_value}`}
                </td>
                <td className="px-4 py-3">{c.status}</td>
                <td className="px-4 py-3">{c.redemptions ?? '—'}</td>
              </tr>))}
            {!rows.length && (<tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  No coupons
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>);
}
