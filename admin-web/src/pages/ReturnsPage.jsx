import { useEffect, useState } from 'react';
import { listReturns, transitionReturn, refundReturn, ApiError } from '../services/api';
import { RequirePermission } from '../components/RequireAuth';
import { useAuth } from '../auth/AuthContext';
export default function ReturnsPage() {
    return (<RequirePermission permission="returns:read">
      <ReturnsInner />
    </RequirePermission>);
}
function ReturnsInner() {
    const { hasPermission } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [actionSuccess, setActionSuccess] = useState(null);
    function load() {
        setLoading(true);
        listReturns({ status: statusFilter || undefined })
            .then((res) => setRows(res.data || []))
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load returns'))
            .finally(() => setLoading(false));
    }
    useEffect(() => {
        load();
    }, [statusFilter]);
    async function handleStatusChange(id, nextStatus) {
        setError(null);
        setActionSuccess(null);
        try {
            await transitionReturn(id, nextStatus, 'Updated by Admin');
            setActionSuccess(`Return #${id} updated to ${nextStatus}`);
            load();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Action failed');
        }
    }
    async function handleRefund(id) {
        if (!window.confirm(`Issue refund for Return #${id}?`))
            return;
        setError(null);
        setActionSuccess(null);
        try {
            await refundReturn(id, undefined, 'Approved return refund');
            setActionSuccess(`Refund processed for Return #${id}`);
            load();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Refund failed');
        }
    }
    return (<div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-stone-900">Return & Exchange Management</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Process size exchanges, open-box damage inspections, and customer refunds
          </p>
        </div>
        <div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-1.5 text-xs bg-white">
            <option value="">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="inspected">Inspected</option>
            <option value="refund_pending">Refund Pending</option>
            <option value="refunded">Refunded</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && <p className="text-red-600 text-xs bg-red-50 p-3 rounded-lg">{error}</p>}
      {actionSuccess && (<p className="text-emerald-700 text-xs bg-emerald-50 p-3 rounded-lg">{actionSuccess}</p>)}

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-xs text-left">
          <thead className="bg-stone-50 text-stone-500 font-medium">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Details / Comment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row) => (<tr key={row.id} className="hover:bg-stone-50/50">
                <td className="px-4 py-3 font-semibold text-stone-800">#{row.id}</td>
                <td className="px-4 py-3 font-mono text-stone-600">
                  {row.order_number || `Order #${row.order_id}`}
                </td>
                <td className="px-4 py-3 capitalize font-medium text-stone-700">
                  {row.reason_code?.replace('_', ' ')}
                </td>
                <td className="px-4 py-3 text-stone-600 max-w-xs truncate">
                  {row.customer_comment || '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded uppercase tracking-wider text-[10px] font-semibold ${row.status === 'approved' || row.status === 'refunded'
                ? 'bg-emerald-100 text-emerald-800'
                : row.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-400">
                  {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-right space-x-1.5">
                  {hasPermission('returns:approve') && row.status === 'requested' && (<>
                      <button type="button" onClick={() => handleStatusChange(row.id, 'approved')} className="px-2 py-1 bg-emerald-700 text-white rounded hover:bg-emerald-800">
                        Approve
                      </button>
                      <button type="button" onClick={() => handleStatusChange(row.id, 'rejected')} className="px-2 py-1 bg-red-700 text-white rounded hover:bg-red-800">
                        Reject
                      </button>
                    </>)}
                  {hasPermission('payments:refund') &&
                (row.status === 'inspected' || row.status === 'refund_pending') && (<button type="button" onClick={() => handleRefund(row.id)} className="px-2 py-1 bg-stone-900 text-white rounded hover:bg-black">
                        Issue Refund
                      </button>)}
                </td>
              </tr>))}
            {!rows.length && !loading && (<tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                  No return requests found.
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>);
}
