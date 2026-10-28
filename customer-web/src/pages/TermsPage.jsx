import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { Link } from 'react-router-dom';
import { Shield, FileText, Phone } from 'lucide-react';

export default function TermsPage() {
    return (
        <Layout>
            <Seo
                title="Terms & Conditions — NP Clothings"
                description="Terms and conditions for bespoke garments, orders, and services at NP Clothings."
            />
            <div className="max-w-4xl mx-auto px-6 py-14 sm:py-20">
                <div className="mb-12 border-b border-stone-200 pb-8 text-center sm:text-left">
                    <span className="text-xs uppercase tracking-[0.25em] text-[#c9a96e] font-semibold block mb-2">
                        Legal & Compliance
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 font-normal tracking-tight">
                        Terms & Conditions
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-stone-500">
                        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div className="space-y-10 text-stone-700 text-sm sm:text-[15px] leading-relaxed">
                    <section className="space-y-3">
                        <h2 className="text-lg font-serif text-stone-900 font-medium">1. Atelier Overview & Acceptance</h2>
                        <p>
                            Welcome to <strong>NP Clothings</strong> (&quot;npclothings.com&quot;). By browsing, accessing, or placing an order through this website, you agree to be bound by these Terms and Conditions. Our atelier specializes in handcrafted quiet luxury apparel, bespoke shirts, made-to-measure tailoring, and curated menswear.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-serif text-stone-900 font-medium">2. Bespoke Customization & Sizing</h2>
                        <p>
                            Each custom garment is crafted to client specifications including collar style (such as signature Chinese collars, spread, or mandarin), button selections (press buttons or mother-of-pearl), placket variations, and custom measurements. Clients are responsible for ensuring that the submitted measurements and sizing choices are accurate.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-serif text-stone-900 font-medium">3. Pricing, Variations & Payments</h2>
                        <p>
                            All prices are quoted in Indian Rupees (INR) and are inclusive of applicable GST unless explicitly stated otherwise. Tailoring variations such as specialized sizes, custom fabrics, or premium collar styles may carry transparent price adjustments clearly reflected in the cart before checkout. We support secure UPI, credit/debit cards, net banking, and verified Cash on Delivery.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-serif text-stone-900 font-medium">4. Pan-India Delivery & Logistics</h2>
                        <p>
                            Orders are dispatched via insured courier partners across 25,000+ Indian pin codes. Standard off-the-rack pieces dispatch within 24-48 hours. Bespoke or made-to-measure orders undergo meticulous hand-finishing and typically ship within 4-7 business days. Real-time tracking is provided via email and WhatsApp upon dispatch.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-serif text-stone-900 font-medium">5. Alterations & Perfect Fit Guarantee</h2>
                        <p>
                            We take pride in our precision tailoring. If your garment requires minor fit adjustments, our styling concierge will coordinate complimentary alteration guidance within 7 days of package delivery.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-serif text-stone-900 font-medium">6. Contact Concierge</h2>
                        <p>
                            For any inquiries regarding these terms or your atelier orders, please reach out to our dedicated concierge:
                        </p>
                        <div className="p-4 bg-stone-100 rounded-xl flex flex-col sm:flex-row gap-4 sm:items-center text-xs sm:text-sm">
                            <span className="font-medium text-stone-900">Phone: +91 88706 86660</span>
                            <span className="hidden sm:inline text-stone-400">•</span>
                            <span className="font-medium text-stone-900">Email: concierge@npclothings.com</span>
                        </div>
                    </section>
                </div>

                <div className="mt-14 pt-8 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                    <Link to="/privacy" className="hover:text-stone-900 underline">Privacy Policy</Link>
                    <Link to="/shipping" className="hover:text-stone-900 underline">Shipping & Returns</Link>
                    <Link to="/contact" className="hover:text-stone-900 underline">Contact Concierge</Link>
                </div>
            </div>
        </Layout>
    );
}

