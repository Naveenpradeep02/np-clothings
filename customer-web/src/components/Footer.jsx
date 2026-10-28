import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Check, ShieldCheck } from 'lucide-react';

export default function Footer() {
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterSuccess, setNewsletterSuccess] = useState(false);

    function handleNewsletterSubmit(e) {
        e.preventDefault();
        if (!newsletterEmail.trim()) return;
        setNewsletterSuccess(true);
        setNewsletterEmail('');
        setTimeout(() => setNewsletterSuccess(false), 5000);
    }

    return (
        <footer className="mt-20 bg-stone-950 text-stone-200 font-sans border-t border-stone-800" role="contentinfo">
            {/* 1. Clean Newsletter Section */}
            <div className="border-b border-stone-800/80 bg-stone-900/40">
                <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#c9a96e] block mb-1.5">
                            NP Atelier
                        </span>
                        <h3 className="text-lg sm:text-xl font-serif text-white tracking-wide">
                            Subscribe for Private Capsule Previews
                        </h3>
                        <p className="text-xs sm:text-sm text-stone-400 mt-1">
                            Be the first to access new bespoke releases and trunk shows.
                        </p>
                    </div>

                    <div className="w-full md:w-auto min-w-[300px] max-w-md">
                        {newsletterSuccess ? (
                            <div className="p-3 bg-emerald-950/70 border border-emerald-600/50 rounded-lg flex items-center gap-2 text-xs sm:text-sm text-emerald-300">
                                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Thank you for subscribing to NP Clothings.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email address…"
                                    value={newsletterEmail}
                                    onChange={(e) => setNewsletterEmail(e.target.value)}
                                    className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#c9a96e] transition-colors"
                                />
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-[#c9a96e] hover:bg-[#b89558] text-stone-950 font-semibold text-xs tracking-widest uppercase rounded-lg transition-colors cursor-pointer shrink-0"
                                >
                                    Join
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Main Navigation Columns */}
            <div className="mx-auto max-w-6xl px-6 py-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Brand Info */}
                    <div className="space-y-4">
                        <Link to="/" className="inline-block text-lg font-medium tracking-[0.25em] uppercase text-white">
                            NP <span className="text-[#c9a96e]">Clothings</span>
                        </Link>
                        <p className="text-sm text-stone-400 leading-relaxed">
                            Quiet luxury menswear tailored with handcrafted precision and pure heirloom fabrics.
                        </p>
                        <div className="pt-1 text-sm space-y-2.5 text-stone-300">
                            <p className="flex items-center gap-2.5">
                                <Phone className="w-4 h-4 text-[#c9a96e] shrink-0" />
                                <a href="tel:+918870686660" className="hover:text-[#c9a96e] transition-colors font-medium">
                                    +91 88706 86660
                                </a>
                            </p>
                            <p className="flex items-center gap-2.5">
                                <Mail className="w-4 h-4 text-[#c9a96e] shrink-0" />
                                <a href="mailto:concierge@npclothings.com" className="hover:text-[#c9a96e] transition-colors">
                                    concierge@npclothings.com
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white mb-4">
                            Collections
                        </h4>
                        <ul className="space-y-2.5 text-sm text-stone-400">
                            <li>
                                <Link to="/shop" className="hover:text-white transition-colors">
                                    All Apparel
                                </Link>
                            </li>
                            <li>
                                <Link to="/shop?category=formal-shirts" className="hover:text-white transition-colors">
                                    Bespoke Formal Shirts
                                </Link>
                            </li>
                            <li>
                                <Link to="/shop?category=casual-linen" className="hover:text-white transition-colors">
                                    Pure Linen Shirts
                                </Link>
                            </li>
                            <li>
                                <Link to="/shop?q=chinese-collar" className="hover:text-white transition-colors">
                                    Chinese Collar Shirts
                                </Link>
                            </li>
                            <li>
                                <Link to="/shop?category=trousers" className="hover:text-white transition-colors">
                                    Tailored Trousers
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customization */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white mb-4">
                            Bespoke Studio
                        </h4>
                        <ul className="space-y-2.5 text-sm text-stone-400">
                            <li>
                                <Link to="/shop" className="hover:text-white transition-colors">
                                    Collar Customization
                                </Link>
                            </li>
                            <li>
                                <Link to="/shop" className="hover:text-white transition-colors">
                                    Press & Pearl Buttons
                                </Link>
                            </li>
                            <li>
                                <Link to="/shop" className="hover:text-white transition-colors">
                                    Made-to-Measure Sizing
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="hover:text-white transition-colors">
                                    The Atelier Story
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Care */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white mb-4">
                            Client Care
                        </h4>
                        <ul className="space-y-2.5 text-sm text-stone-400">
                            <li>
                                <Link to="/account/orders" className="hover:text-white transition-colors">
                                    Track Your Order
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="hover:text-white transition-colors">
                                    Contact Concierge
                                </Link>
                            </li>
                            <li>
                                <Link to="/shipping" className="hover:text-white transition-colors">
                                    Shipping & Returns
                                </Link>
                            </li>
                            <li>
                                <Link to="/faq" className="hover:text-white transition-colors">
                                    FAQ &amp; Bespoke Guide
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="hover:text-white transition-colors">
                                    Terms &amp; Conditions
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="hover:text-white transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 3. Bottom Row: Payment, Designer Credit & Copyright */}
                <div className="mt-12 pt-8 border-t border-stone-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-400">
                    <p>
                        &copy; {new Date().getFullYear()} NP Clothings. All rights reserved.
                    </p>

                    <p className="text-[11px] text-stone-400">
                        Designed &amp; Developed by{' '}
                        <a
                            href="https://naveenpradeep.onrender.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#c9a96e] hover:text-[#dfc28e] underline underline-offset-2 font-medium transition-colors"
                        >
                            Naveen Pradeep
                        </a>
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[11px] font-mono">UPI</span>
                        <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[11px] font-mono">VISA</span>
                        <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[11px] font-mono">Mastercard</span>
                        <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[11px] font-mono">RuPay</span>
                        <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[11px] font-mono">COD</span>
                        <span className="flex items-center gap-1 text-[11px] text-stone-400 ml-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>100% Secure</span>
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
