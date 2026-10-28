import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { listAddresses, createAddress, deleteAddress, ApiError } from '../services/api';
const empty = {
    full_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country_code: 'IN',
    is_default: true,
};
export default function AddressesPage() {
    const { user, loading: authLoading } = useAuth();
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState(empty);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const load = () => listAddresses()
        .then((res) => setRows(res.data || []))
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load addresses'));
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
        return <Navigate to="/login" replace state={{ from: '/account/addresses' }}/>;
    async function onCreate(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await createAddress(form);
            setForm(empty);
            await load();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not save address');
        }
        finally {
            setBusy(false);
        }
    }
    async function onDelete(id) {
        try {
            await deleteAddress(id);
            await load();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Delete failed');
        }
    }
    return (<Layout>
      <Seo title="Addresses" noindex/>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/account" className="text-xs text-stone-500">
          ← Account
        </Link>
        <h1 className="text-2xl font-light tracking-wide mt-2 mb-8">Addresses</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="space-y-3 mb-10">
          {rows.map((a) => (<div key={a.id} className="bg-white border border-stone-200 rounded-xl px-5 py-4 flex justify-between gap-4">
              <div className="text-sm">
                <p className="font-medium">
                  {a.full_name} {a.is_default ? <span className="text-xs text-stone-400">default</span> : null}
                </p>
                <p className="text-stone-500">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ''}
                </p>
                <p className="text-stone-500">
                  {a.city}, {a.state} {a.postal_code}
                </p>
                <p className="text-stone-400 text-xs">{a.phone}</p>
              </div>
              <button type="button" onClick={() => onDelete(a.id)} className="text-xs text-stone-500 underline shrink-0">
                Remove
              </button>
            </div>))}
          {!rows.length && <p className="text-stone-400 text-sm">No saved addresses.</p>}
        </div>

        <form onSubmit={onCreate} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-medium">Add address</h2>
          {[
            ['full_name', 'Full name'],
            ['phone', 'Phone'],
            ['line1', 'Address line 1'],
            ['line2', 'Address line 2'],
            ['city', 'City'],
            ['state', 'State'],
            ['postal_code', 'Postal code'],
        ].map(([key, label]) => (<label key={key} className="block text-xs text-stone-500">
              {label}
              <input required={key !== 'line2'} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"/>
            </label>))}
          <button type="submit" disabled={busy} className="w-full bg-stone-900 text-white rounded-lg py-2 text-sm disabled:opacity-50">
            {busy ? 'Saving…' : 'Save address'}
          </button>
        </form>
      </div>
    </Layout>);
}
