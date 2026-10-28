import { useEffect, useState } from 'react';
import { listCustomers, updateCustomerStatus, ApiError } from '../services/api';
import { RequirePermission } from '../components/RequireAuth';
import { useAuth } from '../auth/AuthContext';
export default function CustomersPage() {
    return (<RequirePermission permission="customers:read">
      <CustomersInner />
    </RequirePermission>);
}
function CustomersInner() {
    const { hasPermission } = useAuth();
    const [q, setQ] = useState('');
    const [rows, setRows] = useState([]);
    const [error, setError] = useState(null);
    const load = (search) => listCustomers({ q: search || undefined, limit: 50 })
        .then((res) => setRows(res.data || []))
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load customers'));
    useEffect(() => {
        load();
    }, []);
    async function setStatus(c, status) {
        try {
            await updateCustomerStatus(c.id, status, `Admin set ${status}`);
            await load(q);
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Status update failed');
        }
    }
    return (<div>
      <h1 className="text-lg font-medium mb-6">Customers</h1>
      <form className="flex gap-2 mb-4" onSubmit={(e) => {
            e.preventDefault();
            load(q);
        }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email…" className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white"/>
        <button type="submit" className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm">
          Search
        </button>
      </form>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-stone-500 text-left">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"/>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (<tr key={c.id} className="border-t border-stone-100">
                <td className="px-4 py-3">
                  <div>{c.profile?.display_name || c.profile?.first_name || '—'}</div>
                  <div className="text-xs text-stone-400">{c.email}</div>
                </td>
                <td className="px-4 py-3">{c.status}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  {hasPermission('customers:read') && c.status === 'active' && (<button type="button" className="text-xs underline text-stone-600" onClick={() => setStatus(c, 'suspended')}>
                      Suspend
                    </button>)}
                  {c.status !== 'active' && (<button type="button" className="text-xs underline text-stone-600" onClick={() => setStatus(c, 'active')}>
                      Activate
                    </button>)}
                </td>
              </tr>))}
            {!rows.length && (<tr>
                <td colSpan={3} className="px-4 py-8 text-center text-stone-400">
                  No customers
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>);
}
