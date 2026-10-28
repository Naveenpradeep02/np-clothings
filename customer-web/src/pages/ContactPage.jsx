import { useState } from 'react';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { Phone, Mail, MessageSquare, MapPin, Check, Send } from 'lucide-react';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    function handleSubmit(e) {
        e.preventDefault();
        setSubmitted(true);
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
        setTimeout(() => setSubmitted(false), 6000);
    }

    return (
        <Layout>
            <Seo
                title="Contact Concierge — NP Clothings"
                description="Connect with our bespoke menswear atelier, custom tailoring styling desk, and customer support."
            />
            <div className="max-w-5xl mx-auto px-6 py-14 sm:py-20">
                <div className="mb-12 border-b border-stone-200 pb-8 text-center">
                    <span className="text-xs uppercase tracking-[0.25em] text-[#c9a96e] font-semibold block mb-2">
                        Atelier Assistance
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 font-normal tracking-tight">
                        Client Concierge & Consultation
                    </h1>
                    <p className="mt-3 text-sm text-stone-500 max-w-xl mx-auto leading-relaxed">
                        Whether inquiring about made-to-measure fittings, collar variations, wedding capsule orders, or order status, our stylists are at your service.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Direct Contact Cards */}
                    <div className="space-y-6">
                        <div className="p-6 bg-white border border-stone-200 rounded-xl shadow-xs">
                            <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-[#c9a96e] mb-4">
                                <Phone className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900 mb-1">
                                Call Concierge
                            </h3>
                            <p className="text-xs text-stone-500 mb-3">
                                Mon to Sat: 10:00 AM – 7:00 PM IST
                            </p>
                            <a
                                href="tel:+918870686660"
                                className="text-sm font-medium text-stone-900 hover:text-[#c9a96e] transition-colors"
                            >
                                +91 88706 86660
                            </a>
                        </div>

                        <div className="p-6 bg-white border border-stone-200 rounded-xl shadow-xs">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900 mb-1">
                                WhatsApp Stylist
                            </h3>
                            <p className="text-xs text-stone-500 mb-3">
                                Quick fit advice, swatch photos & live support
                            </p>
                            <a
                                href="https://wa.me/918870686660?text=Hi%20NP%20Clothings,%20I%20would%20like%20to%20inquire%20about%20bespoke%20shirts."
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                                <span>Message on WhatsApp</span>
                            </a>
                        </div>

                        <div className="p-6 bg-white border border-stone-200 rounded-xl shadow-xs">
                            <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-[#c9a96e] mb-4">
                                <Mail className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900 mb-1">
                                Email Atelier
                            </h3>
                            <p className="text-xs text-stone-500 mb-3">
                                For collaborations, wedding orders & bulk requests
                            </p>
                            <a
                                href="mailto:concierge@npclothings.com"
                                className="text-sm font-medium text-stone-900 hover:text-[#c9a96e] transition-colors"
                            >
                                concierge@npclothings.com
                            </a>
                        </div>
                    </div>

                    {/* Inquiry Form */}
                    <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 shadow-xs">
                        <h2 className="text-xl font-serif text-stone-900 mb-2">Send a Message</h2>
                        <p className="text-xs text-stone-500 mb-6">
                            Fill in your details below and our tailoring concierge will respond within 24 hours.
                        </p>

                        {submitted ? (
                            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
                                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                                <div>
                                    <p className="font-semibold">Thank you for reaching out.</p>
                                    <p className="text-xs text-emerald-700 mt-0.5">
                                        Your inquiry has been received. Our concierge will contact you shortly.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                                            Your Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="Naveen"
                                            className="w-full border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#c9a96e]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="you@example.com"
                                            className="w-full border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#c9a96e]"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            placeholder="+91 88706 86660"
                                            className="w-full border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#c9a96e]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            value={form.subject}
                                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                            placeholder="Bespoke Chinese Collar inquiry"
                                            className="w-full border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#c9a96e]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                                        Your Message *
                                    </label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        placeholder="Please share sizing requirements, collar preferences, or order questions…"
                                        className="w-full border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#c9a96e]"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-medium rounded-lg transition-colors cursor-pointer"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Send Message</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

