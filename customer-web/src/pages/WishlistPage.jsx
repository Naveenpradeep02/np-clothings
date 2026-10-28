import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { listWishlist, removeFromWishlist, ApiError } from '../services/api';
export default function WishlistPage() {
    const { user, loading: authLoading } = useAuth();
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);
    const load = () => listWishlist()
        .then((res) => setItems(res.data || []))
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load wishlist'));
    useEffect(() => {
        if (user)
            load();
    }, [user]);
    if (authLoading) {
        return (<Layout>
        <p className="p-12 text-center text-stone-400 text-sm">Loading…</p>
      </Layout>);
    }
    if (!user)
        return <Navigate to="/login" replace state={{ from: '/account/wishlist' }}/>;
    async function remove(id) {
        try {
            await removeFromWishlist(id);
            await load();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Remove failed');
        }
    }
    return (<Layout>
      <Seo title="Wishlist" noindex/>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/account" className="text-xs text-stone-500">
          ← Account
        </Link>
        <h1 className="text-2xl font-light tracking-wide mt-2 mb-8">Wishlist</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="space-y-3">
          {items.map((it) => (<div key={it.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-4">
              <div>
                <Link to={`/product/${it.product_slug}`} className="font-medium hover:underline">
                  {it.product_name}
                </Link>
                {it.sku && <p className="text-xs text-stone-400">{it.sku}</p>}
              </div>
              <button type="button" onClick={() => remove(it.id)} className="text-xs text-stone-500 underline">
                Remove
              </button>
            </div>))}
          {!items.length && !error && (<p className="text-stone-400 text-sm">
              Nothing saved yet. <Link to="/shop" className="underline">Browse the shop</Link>
            </p>)}
        </div>
      </div>
    </Layout>);
}
