import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { listAddresses, createAddress, deleteAddress, ApiError } from '../services/api';
import {
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

const emptyAddress = {
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
  const [form, setForm] = useState(emptyAddress);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    listAddresses()
      .then((res) => setRows(res.data || []))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load addresses')
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
            Loading address directory…
          </p>
        </div>
      </Layout>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: '/account/addresses' }} />;

  async function onCreate(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createAddress(form);
      setForm(emptyAddress);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save address');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id) {
    try {
      await deleteAddress(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  return (
    <Layout>
      <Seo title="Delivery Addresses — NP Clothings" noindex />
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
            Delivery Addresses
          </span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 mb-8 border-b border-stone-200 gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] font-semibold block mb-1">
              Logistics
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 font-light tracking-wide">
              Saved Destinations
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-medium rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showForm ? 'Close Form' : 'Add New Address'}</span>
          </button>
        </div>

        {error && (
          <p className="text-red-700 text-xs mb-6 bg-red-50 p-4 rounded-xl border border-red-200">
            {error}
          </p>
        )}

        {/* Add Address Form Accordion */}
        {showForm && (
          <form
            onSubmit={onCreate}
            className="mb-10 p-6 sm:p-8 bg-white border border-stone-300 rounded-2xl shadow-sm space-y-4 animate-page-enter"
          >
            <h3 className="font-serif text-lg text-stone-900 font-medium mb-1">
              Add New Delivery Destination
            </h3>
            <p className="text-xs text-stone-500 font-light mb-4">
              All deliveries are handled via insured pan-India express couriers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1 font-medium">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Recipient Name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#c9a96e]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1 font-medium">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 88706 86660"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#c9a96e]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1 font-medium">
                Address Line 1 (Street / Building) *
              </label>
              <input
                type="text"
                required
                placeholder="Door / Flat No., Apartment / Building Name, Street"
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
                className="w-full border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#c9a96e]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1 font-medium">
                Address Line 2 (Area / Landmark)
              </label>
              <input
                type="text"
                placeholder="Near Landmark, Colony, Area"
                value={form.line2}
                onChange={(e) => setForm({ ...form, line2: e.target.value })}
                className="w-full border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#c9a96e]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1 font-medium">
                  City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Chennai"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#c9a96e]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1 font-medium">
                  State *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tamil Nadu"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#c9a96e]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1 font-medium">
                  Postal Code (PIN) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="600001"
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#c9a96e]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                  className="rounded border-stone-300 text-stone-900"
                />
                <span>Set as primary default shipping address</span>
              </label>

              <button
                type="submit"
                disabled={busy}
                className="px-6 py-2.5 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Save Address'}
              </button>
            </div>
          </form>
        )}

        {/* Existing Addresses Grid */}
        {!loading && rows.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {rows.map((a) => (
              <div
                key={a.id}
                className="relative p-6 bg-white border border-stone-200/90 rounded-2xl shadow-xs space-y-2.5 luxury-card-hover"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900 text-sm">
                      {a.full_name}
                    </span>
                    {a.is_default && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-amber-50 text-[#a37d32] border border-amber-200">
                        Primary Default
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onDelete(a.id)}
                    className="text-stone-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                    title="Remove address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-stone-600 space-y-0.5 font-light leading-relaxed">
                  <p>{a.line1}</p>
                  {a.line2 && <p>{a.line2}</p>}
                  <p>
                    {a.city}, {a.state} — {a.postal_code}
                  </p>
                  <p className="text-stone-400 text-[11px] pt-1">Contact: {a.phone}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && rows.length === 0 && !error && (
          <div className="text-center py-20 bg-white border border-stone-200 rounded-2xl p-8 shadow-xs">
            <Building className="w-12 h-12 text-stone-300 mx-auto mb-3 stroke-[1.2]" />
            <h3 className="text-lg font-serif text-stone-900 font-normal mb-1">
              No addresses saved yet
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6 leading-relaxed font-light">
              Add your primary delivery address for expedited one-click checkout across our collections.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Address</span>
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
