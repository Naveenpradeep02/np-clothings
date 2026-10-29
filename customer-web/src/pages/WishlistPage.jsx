import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { listWishlist, removeFromWishlist, ApiError } from '../services/api';
import { Heart, Trash2, ArrowRight, ChevronRight, Shirt, ShoppingBag } from 'lucide-react';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    listWishlist()
      .then((res) => setItems(res.data || []))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load wishlist')
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center p-12">
          <p className="text-stone-400 text-xs tracking-widest uppercase animate-pulse">
            Loading wishlist…
          </p>
        </div>
      </Layout>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: '/account/wishlist' }} />;

  async function remove(id) {
    try {
      await removeFromWishlist(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Remove failed');
    }
  }

  return (
    <Layout>
      <Seo title="Saved Creations & Wishlist — NP Clothings" noindex />
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
            Curated Wishlist
          </span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 mb-8 border-b border-stone-200 gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] font-semibold block mb-1">
              Personal Archive
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 font-light tracking-wide">
              Saved Pieces ({items.length})
            </h1>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold uppercase tracking-widest text-[#a37d32] hover:text-[#7f5e20] transition-colors"
          >
            Browse Collections &rarr;
          </Link>
        </div>

        {error && <p className="text-red-600 text-xs mb-6 bg-red-50 p-4 rounded-xl border border-red-200">{error}</p>}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-5 bg-white border border-stone-200 rounded-2xl animate-pulse h-28"></div>
            ))}
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {items.map((it) => (
              <div
                key={it.id}
                className="group flex items-center justify-between p-5 bg-white border border-stone-200/90 rounded-2xl shadow-xs luxury-card-hover transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-18 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                    <Shirt className="w-6 h-6 stroke-[1.2] text-stone-400" />
                  </div>
                  <div>
                    <Link
                      to={`/product/${it.product_slug || it.product_id}`}
                      className="font-serif text-base font-normal text-stone-900 group-hover:text-[#a37d32] transition-colors block"
                    >
                      {it.product_name}
                    </Link>
                    {it.sku && <p className="text-[11px] text-stone-400 mt-0.5">SKU: {it.sku}</p>}
                    <Link
                      to={`/product/${it.product_slug || it.product_id}`}
                      className="inline-flex items-center gap-1 text-[11px] text-[#c9a96e] font-medium uppercase tracking-wider mt-2 hover:underline"
                    >
                      <span>Tailor Piece</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove from saved pieces"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && !items.length && !error && (
          <div className="text-center py-20 bg-white border border-stone-200 rounded-2xl p-8 shadow-xs">
            <Heart className="w-12 h-12 text-stone-300 mx-auto mb-3 stroke-[1.2]" />
            <h3 className="text-lg font-serif text-stone-900 font-normal mb-1">
              Your wishlist is currently empty
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6 leading-relaxed font-light">
              Explore our runway capsules, signature Chinese stand collar shirts, and heirloom linens to curate your private wardrobe.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-medium rounded-lg transition-colors"
            >
              <span>Explore Collections</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#c9a96e]" />
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
