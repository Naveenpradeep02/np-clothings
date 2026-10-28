import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    X,
    MapPin,
    Phone,
    Mail,
    Clock,
    ArrowUpRight,
    MessageSquare,
    ShieldCheck,
    FileText,
    Headphones,
} from 'lucide-react';

export default function InfoSidebar({ isOpen, onClose }) {
    // Close on Escape key press
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape') onClose();
        }
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Atelier Information">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md bg-stone-50 border-l border-stone-200 text-stone-900 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-stone-200 bg-white flex items-center justify-between sticky top-0 z-10">
                        <div>
                            <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#c9a96e] block">
                                Concierge Desk
                            </span>
                            <h2 className="text-base font-serif font-medium tracking-wide uppercase text-stone-900">
                                NP Clothings Atelier
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                            aria-label="Close sidebar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
                        {/* 1. Address Section */}
                        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-900">
                                <MapPin className="w-4 h-4 text-[#c9a96e]" />
                                <span>Atelier Address</span>
                            </div>
                            <p className="text-xs text-stone-600 leading-relaxed font-light">
                                <strong>NP Clothings Atelier & Tailoring House</strong><br />
                                14, Kamaraj Road, Tirupur, Tamil Nadu – 641604, India.<br />
                                <span className="text-[11px] text-[#a37d32] font-medium block mt-1">
                                    ✦ Complimentary Insured Delivery across 25,000+ Indian Pin Codes
                                </span>
                            </p>
                        </div>

                        {/* 2. Contact Details */}
                        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-3.5">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-900">
                                <Phone className="w-4 h-4 text-[#c9a96e]" />
                                <span>Contact Details</span>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                                    <span className="text-stone-500">Helpline:</span>
                                    <a href="tel:+918870686660" className="font-medium text-stone-900 hover:text-[#c9a96e] transition-colors">
                                        +91 88706 86660
                                    </a>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                                    <span className="text-stone-500">Email:</span>
                                    <a href="mailto:concierge@npclothings.com" className="font-medium text-stone-900 hover:text-[#c9a96e] transition-colors">
                                        concierge@npclothings.com
                                    </a>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                                    <span className="text-stone-500">Hours:</span>
                                    <span className="text-stone-700 font-light">Mon – Sat: 10 AM – 7 PM IST</span>
                                </div>
                            </div>

                            <a
                                href="https://wa.me/918870686660?text=Hi%20NP%20Clothings,%20I%20have%20an%20inquiry%20regarding%20bespoke%20shirts."
                                target="_blank"
                                rel="noreferrer"
                                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium tracking-wide transition-colors"
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Chat with Styling Concierge</span>
                            </a>
                        </div>

                        {/* 3. Support & Quick Pages */}
                        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-900">
                                <Headphones className="w-4 h-4 text-[#c9a96e]" />
                                <span>Support & Help Center</span>
                            </div>

                            <div className="grid grid-cols-1 gap-2 text-xs">
                                <Link
                                    to="/contact"
                                    onClick={onClose}
                                    className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-stone-100 rounded-lg text-stone-800 transition-colors"
                                >
                                    <span>Contact Concierge & Consultation Form</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" />
                                </Link>

                                <Link
                                    to="/shipping"
                                    onClick={onClose}
                                    className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-stone-100 rounded-lg text-stone-800 transition-colors"
                                >
                                    <span>Shipping & Returns Policy</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" />
                                </Link>

                                <Link
                                    to="/terms"
                                    onClick={onClose}
                                    className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-stone-100 rounded-lg text-stone-800 transition-colors"
                                >
                                    <span>Terms & Conditions</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" />
                                </Link>

                                <Link
                                    to="/faq"
                                    onClick={onClose}
                                    className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-stone-100 rounded-lg text-stone-800 transition-colors"
                                >
                                    <span>FAQ &amp; Bespoke Tailoring Guide</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" />
                                </Link>

                                <Link
                                    to="/about"
                                    onClick={onClose}
                                    className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-stone-100 rounded-lg text-stone-800 transition-colors"
                                >
                                    <span>The Atelier Story &amp; Heritage</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" />
                                </Link>
                            </div>
                        </div>

                        {/* 4. Social Media Links */}
                        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-stone-900 block">
                                Connect with Atelier
                            </span>

                            <div className="flex items-center gap-3">
                                <a
                                    href="https://instagram.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-medium text-stone-800 transition-colors"
                                    title="Instagram"
                                >
                                    <svg className="w-3.5 h-3.5 text-pink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                                    </svg>
                                    <span>Instagram</span>
                                </a>

                                <a
                                    href="https://facebook.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-medium text-stone-800 transition-colors"
                                    title="Facebook"
                                >
                                    <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                                    </svg>
                                    <span>Facebook</span>
                                </a>

                                <a
                                    href="https://wa.me/918870686660"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-medium text-stone-800 transition-colors"
                                    title="WhatsApp Channel"
                                >
                                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>WhatsApp</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Footer inside Drawer */}
                    <div className="px-6 py-4 border-t border-stone-200 bg-white flex flex-col gap-1 text-[11px] text-stone-500">
                        <div className="flex items-center justify-between">
                            <span>&copy; {new Date().getFullYear()} NP Clothings</span>
                            <span className="text-stone-400">Quiet Luxury Menswear</span>
                        </div>
                        <div className="text-[10px] text-stone-400 pt-0.5">
                            Designed & Developed by{' '}
                            <a
                                href="https://naveenpradeep.onrender.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#c9a96e] hover:underline font-medium"
                            >
                                Naveen Pradeep
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
