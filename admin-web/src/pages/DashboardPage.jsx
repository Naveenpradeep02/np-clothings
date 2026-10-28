import { useEffect, useState } from 'react';
import { getOverview, ApiError } from '../services/api';
export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        getOverview()
            .then((res) => setData(res.data))
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load overview'));
    }, []);
    const funnel = (data?.funnel || {});
    const events = (data?.events || {});
    return (<div>
      <h1 className="text-lg font-medium text-stone-900 mb-6">Dashboard</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {!data && !error && <p className="text-stone-400 text-sm">Loading metrics…</p>}
      {data && (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card label="Orders" value={String(data.orders ?? 0)}/>
          <Card label="Revenue" value={`₹${Number(data.revenue || 0).toLocaleString('en-IN')}`}/>
          <Card label="Searches" value={String(data.searches ?? 0)}/>
          <Card label="Product views" value={String(events.product_view ?? 0)}/>
          <Card label="Add to cart" value={String(funnel.add_to_cart ?? events.add_to_cart ?? 0)}/>
          <Card label="Purchases (events)" value={String(funnel.purchase ?? 0)}/>
        </div>)}
    </div>);
}
function Card({ label, value }) {
    return (<div className="bg-white border border-stone-200 rounded-xl p-5">
      <p className="text-xs uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-2 text-2xl font-light text-stone-900">{value}</p>
    </div>);
}
