import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import {
  ShoppingBag,
  Heart,
  MapPin,
  Sparkles,
  ArrowRight,
  LogOut,
  User,
  ShieldCheck,
  Scissors,
  Phone,
} from 'lucide-react';

export default function AccountPage() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center p-12">
          <p className="text-stone-400 text-xs tracking-widest uppercase animate-pulse">
            Loading member profile…
          </p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/account' }} />;
  }

  const displayName =
    user.profile?.display_name ||
    user.profile?.first_name ||
    user.email?.split('@')[0] ||
    'Client';

  const memberLinks = [
    {
      to: '/account/orders',
      label: 'Bespoke Orders',
      desc: 'Track single-needle tailoring & shipping transit',
      icon: ShoppingBag,
    },
    {
      to: '/account/wishlist',
      label: 'Curated Wishlist',
      desc: 'Saved fabrics, silhouettes & future capsules',
      icon: Heart,
    },
    {
      to: '/account/addresses',
      label: 'Delivery Addresses',
      desc: 'Manage verified doorstep delivery destinations',
      icon: MapPin,
    },
  ];

  return (
    <Layout>
      <Seo title="Member Atelier Profile" noindex />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
        {/* Profile Banner */}
        <div className="p-8 sm:p-10 rounded-2xl bg-white border border-stone-200/90 shadow-xs mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-900 text-[#c9a96e] flex items-center justify-center text-xl font-serif font-light shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 font-light tracking-wide">
                  Welcome, {displayName}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#a37d32] border border-amber-200/80 text-[10px] uppercase tracking-wider font-semibold">
                  Atelier Member
                </span>
              </div>
              <p className="text-xs text-stone-500 font-light mt-1">{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-stone-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-medium text-stone-600 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Member Navigation Cards */}
        <div className="grid gap-5 sm:grid-cols-3 mb-10">
          {memberLinks.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className="group flex flex-col justify-between p-6 bg-white border border-stone-200/90 hover:border-stone-400 rounded-2xl shadow-xs luxury-card-hover transition-all"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-[#c9a96e] mb-4 group-hover:bg-stone-900 transition-colors">
                    <Icon className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <h3 className="font-serif text-lg font-normal text-stone-900 mb-1 group-hover:text-[#a37d32] transition-colors">
                    {l.label}
                  </h3>
                  <p className="text-xs text-stone-500 font-light leading-relaxed">
                    {l.desc}
                  </p>
                </div>

                <div className="pt-6 flex items-center gap-1.5 text-xs font-medium text-stone-900 group-hover:gap-2.5 transition-all">
                  <span className="uppercase tracking-widest text-[11px]">View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#c9a96e]" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bespoke Fit & Concierge Support Desk */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-stone-100/70 border border-stone-200/80 space-y-3">
            <div className="flex items-center gap-2 text-stone-900">
              <Scissors className="w-4 h-4 text-[#c9a96e]" />
              <h4 className="text-xs uppercase tracking-widest font-semibold">
                Made-to-Measure Guarantee
              </h4>
            </div>
            <p className="text-xs text-stone-600 font-light leading-relaxed">
              Every shirt purchased through your profile includes complimentary alterations within 7 days of package delivery.
            </p>
            <Link
              to="/shipping"
              className="inline-block text-xs font-medium text-[#a37d32] hover:underline"
            >
              Read Alteration Guidelines &rarr;
            </Link>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-stone-900 text-stone-100 space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Phone className="w-4 h-4 text-[#c9a96e]" />
              <h4 className="text-xs uppercase tracking-widest font-semibold">
                Private Styling Concierge
              </h4>
            </div>
            <p className="text-xs text-stone-400 font-light leading-relaxed">
              Need custom measurements, wedding party consultations, or fabric swatches? Contact our stylists directly.
            </p>
            <a
              href="https://wa.me/918870686660"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#c9a96e] hover:text-white transition-colors"
            >
              <span>Message Stylist on WhatsApp (+91 88706 86660) &rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
