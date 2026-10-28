import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
export default function AccountPage() {
    const { user, loading, logout } = useAuth();
    if (loading) {
        return (<Layout>
        <p className="p-12 text-center text-stone-400 text-sm">Loading…</p>
      </Layout>);
    }
    if (!user)
        return <Navigate to="/login" replace state={{ from: '/account' }}/>;
    const links = [
        { to: '/account/orders', label: 'Orders', desc: 'Track and review purchases' },
        { to: '/account/wishlist', label: 'Wishlist', desc: 'Saved pieces' },
        { to: '/account/addresses', label: 'Addresses', desc: 'Shipping destinations' },
    ];
    return (<Layout>
      <Seo title="Account" noindex/>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-2xl font-serif text-stone-900 tracking-wide">
              Hi, {user.profile?.display_name || user.profile?.first_name || 'Member'}
            </h1>
            <p className="text-sm text-stone-500 mt-1">{user.email}</p>
          </div>
          <button type="button" onClick={() => logout()} className="text-xs text-stone-500 hover:text-stone-900 underline transition-colors">
            Sign out
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {links.map((l) => (<Link key={l.to} to={l.to} className="block bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-400 transition-colors">
              <p className="font-medium text-stone-900">{l.label}</p>
              <p className="text-xs text-stone-400 mt-1">{l.desc}</p>
            </Link>))}
        </div>
      </div>
    </Layout>);
}
