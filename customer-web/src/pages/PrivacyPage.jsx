import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://npclothings.com/',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Privacy Policy',
                item: 'https://npclothings.com/privacy',
            },
        ],
    };

    return (
        <Layout>
            <Seo
                title="Privacy Policy — NP Clothings"
                description="Privacy policy detailing how NP Clothings collects, protects, and handles your personal information."
                canonical="https://npclothings.com/privacy"
                jsonLd={breadcrumbJsonLd}
            />
            <div className="max-w-4xl mx-auto px-6 py-14 sm:py-20">
                <div className="mb-12 border-b border-stone-200 pb-8 text-center sm:text-left">
                    <span className="text-xs uppercase tracking-[0.25em] text-[#c9a96e] font-semibold block mb-2">
                        Data Protection & Trust
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 font-normal tracking-tight">
                        Privacy Policy
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-stone-500">
                        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div className="space-y-10 text-stone-700 text-sm sm:text-[15px] leading-relaxed">
                    <section className="space-y-3">
                        <h2 className="text-lg font-serif text-stone-900 font-medium">1. Information We Collect</h2>
                        <p>
                            We collect personal information necessary to deliver bespoke garments and provide concierge services. This includes your name, email address, phone number, delivery address, sizing measurements, and order history.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-serif text-stone-900 font-medium">2. Use of Bespoke Data</h2>
                        <p>
                            Your custom styling preferences, collar selections, button choices, and made-to-measure records are stored securely in your client profile to ensure precision tailoring across repeat orders and future trunk shows.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-serif text-stone-900 font-medium">3. Payment Security & Encryption</h2>
                        <p>
                            Payment transactions are processed through RBI-compliant, 256-bit SSL encrypted payment gateways. NP Clothings never stores your credit card CVV or sensitive banking credentials on our servers.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-serif text-stone-900 font-medium">4. Sharing with Logistics Partners</h2>
                        <p>
                            We share your contact details and shipping address solely with trusted courier partners to facilitate insured doorstep delivery and real-time SMS/WhatsApp dispatch alerts.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-serif text-stone-900 font-medium">5. Client Rights & Contact</h2>
                        <p>
                            You have the right to inspect, update, or request the deletion of your personal data at any time by contacting our privacy officer:
                        </p>
                        <div className="p-4 bg-stone-100 rounded-xl flex flex-col sm:flex-row gap-4 sm:items-center text-xs sm:text-sm">
                            <span className="font-medium text-stone-900">Phone: +91 88706 86660</span>
                            <span className="hidden sm:inline text-stone-400">•</span>
                            <span className="font-medium text-stone-900">Email: concierge@npclothings.com</span>
                        </div>
                    </section>
                </div>

                <div className="mt-14 pt-8 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                    <Link to="/terms" className="hover:text-stone-900 underline">Terms & Conditions</Link>
                    <Link to="/shipping" className="hover:text-stone-900 underline">Shipping & Returns</Link>
                    <Link to="/contact" className="hover:text-stone-900 underline">Contact Concierge</Link>
                </div>
            </div>
        </Layout>
    );
}

