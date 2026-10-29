import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, Shirt, HelpCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <Layout>
      <Seo title="404 — Page Not Found" description="The page you requested could not be located in our archive." noindex />
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-stone-200/60 border border-stone-300 flex items-center justify-center text-[#c9a96e] mb-6">
          <Compass className="w-8 h-8 stroke-[1.5]" />
        </div>

        <span className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] font-semibold block mb-2">
          Archive Reference 404
        </span>

        <h1 className="text-4xl sm:text-5xl font-serif text-stone-900 font-light tracking-wide mb-4">
          Creation Not Found
        </h1>

        <p className="text-stone-500 text-sm sm:text-base font-light leading-relaxed mb-10 max-w-md">
          The bespoke pattern, capsule collection, or route you are seeking is either relocated or no longer in our active atelier catalog.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-medium rounded-xl shadow-md transition-all"
          >
            <Shirt className="w-4 h-4 text-[#c9a96e]" />
            <span>Explore Collections</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-stone-300 hover:border-stone-400 text-stone-800 text-xs uppercase tracking-widest font-medium rounded-xl transition-all"
          >
            <span>Return to Atelier Home</span>
          </Link>
        </div>

        <div className="mt-14 pt-8 border-t border-stone-200/80 w-full flex flex-wrap justify-center gap-6 text-xs text-stone-500">
          <Link to="/about" className="hover:text-stone-900 transition-colors">Our Story</Link>
          <Link to="/faq" className="hover:text-stone-900 transition-colors">FAQ & Sizing</Link>
          <Link to="/contact" className="hover:text-stone-900 transition-colors">Client Concierge</Link>
          <Link to="/shipping" className="hover:text-stone-900 transition-colors">Shipping & Returns</Link>
        </div>
      </div>
    </Layout>
  );
}

