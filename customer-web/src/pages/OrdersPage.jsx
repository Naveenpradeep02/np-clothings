import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { listMyOrders, ApiError } from '../services/api';
import {
  ShoppingBag,
  ChevronRight,
  ArrowRight,
  Clock,
  PackageCheck,
  Truck,
  AlertCircle,
  Shirt,
} from 'lucide-react';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    listMyOrders()
      .then((res) => setRows(res.data || []))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load orders')
      )
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center p-12">
          <p className="text-stone-400 text-xs tracking-widest uppercase animate-pulse">
            Verifying member session…
          </p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/account/orders' }} />;
  }

  function getStatusBadge(status = '') {
    const s = status.toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
          <PackageCheck className="w-3 h-3" />
          <span>Delivered</span>
        </span>
      );
    }
    if (s === 'shipped' || s === 'in_transit') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
          <Truck className="w-3 h-3" />
          <span>In Transit</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3 h-3" />
        <span className="capitalize">{status || 'Processing'}</span>
      </span>
    );
  }

  return (
    <Layout>
      <Seo title="Your Bespoke Orders — NP Clothings" noindex />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link to="/" className="hover:text-stone-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/account" className="hover:text-stone-900 transition-colors">
            Account
          </Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="text-stone-900 font-medium" aria-current="page">
            Bespoke Orders
          </span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 mb-8 border-b border-stone-200 gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] font-semibold block mb-1">
              Order History
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 font-light tracking-wide">
              Bespoke Purchases
            </h1>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold uppercase tracking-widest text-[#a37d32] hover:text-[#7f5e20] transition-colors"
          >
            Explore New Creations &rarr;
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-6 bg-white border border-stone-200 rounded-2xl animate-pulse space-y-3">
                <div className="h-4 bg-stone-200 rounded w-1/4"></div>
                <div className="h-3 bg-stone-100 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Orders list */}
        {!loading && rows.length > 0 && (
          <div className="space-y-4">
            {rows.map((o) => (
              <Link
                key={o.id}
                to={`/account/orders/${o.id}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-stone-200/90 hover:border-stone-400 rounded-2xl shadow-xs luxury-card-hover transition-all gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="font-serif text-base sm:text-lg font-medium text-stone-900 group-hover:text-[#a37d32] transition-colors">
                      {o.order_number || `Order #${o.id}`}
                    </p>
                    {getStatusBadge(o.status)}
                  </div>
                  <p className="text-xs text-stone-500 font-light">
                    Placed on {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'} &bull; Payment:{' '}
                    <span className="capitalize">{o.payment_status || 'Paid'}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-stone-400">Total Investment</p>
                    <p className="text-sm sm:text-base font-semibold text-stone-900">
                      ₹{Number(o.grand_total || o.total || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-stone-900 group-hover:text-[#c9a96e] transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && rows.length === 0 && !error && (
          <div className="text-center py-20 bg-white border border-stone-200 rounded-2xl p-8 shadow-xs">
            <Shirt className="w-12 h-12 text-stone-300 mx-auto mb-3 stroke-[1.2]" />
            <h3 className="text-lg font-serif text-stone-900 font-normal mb-1">
              No bespoke garments ordered yet
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6 leading-relaxed font-light">
              Your personalized wardrobe history will be displayed here once you craft your first order.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-medium rounded-lg transition-colors"
            >
              <span>Explore The Collection</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#c9a96e]" />
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
