import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { Link } from 'react-router-dom';
import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';

export default function ShippingPolicyPage() {
    return (
        <Layout>
            <Seo
                title="Shipping & Returns Policy — NP Clothings"
                description="Pan-India insured delivery timelines, tracking, and alteration policies at NP Clothings."
            />
            <div className="max-w-4xl mx-auto px-6 py-14 sm:py-20">
                <div className="mb-12 border-b border-stone-200 pb-8 text-center sm:text-left">
                    <span className="text-xs uppercase tracking-[0.25em] text-[#c9a96e] font-semibold block mb-2">
                        Logistics & Care
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 font-normal tracking-tight">
                        Shipping & Returns
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-stone-500">
                        Pan-India insured delivery & tailoring satisfaction guarantee
                    </p>
                </div>

                <div className="space-y-10 text-stone-700 text-sm sm:text-[15px] leading-relaxed">
                    <section className="space-y-3">
                        <div className="flex items-center gap-2.5 text-stone-900 font-medium">
                            <Truck className="w-5 h-5 text-[#c9a96e]" />
                            <h2 className="text-lg font-serif">1. Pan-India Delivery Timelines</h2>
                        </div>
                        <p>
                            We partner with premium courier services to offer complimentary insured dispatch across 25,000+ Indian postal codes.
                        </p>
                        <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
                            <li><strong>Ready-to-Wear Collection:</strong> Dispatched within 24-48 business hours; arrives in 3-5 days.</li>
                            <li><strong>Bespoke / Made-to-Measure:</strong> Individually patterned and tailored; ships within 4-7 business days.</li>
                            <li><strong>Metro Deliveries:</strong> Express transit to Chennai, Bangalore, Mumbai, Delhi NCR, and Hyderabad within 2-4 days post-dispatch.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center gap-2.5 text-stone-900 font-medium">
                            <ShieldCheck className="w-5 h-5 text-[#c9a96e]" />
                            <h2 className="text-lg font-serif">2. Packaging & Transit Insurance</h2>
                        </div>
                        <p>
                            Every NP Clothings order is packaged in dust-proof garment protection cases to ensure heirloom linens and fine cotton shirts arrive crease-free and pristine. All shipments are fully insured during transit against loss or damage.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center gap-2.5 text-stone-900 font-medium">
                            <RotateCcw className="w-5 h-5 text-[#c9a96e]" />
                            <h2 className="text-lg font-serif">3. Alterations & Perfect Fit Policy</h2>
                        </div>
                        <p>
                            If your custom shirt requires fine-tuning on sleeve length, collar circumference, or waist taper, our master cutters provide complimentary alteration coordination within 7 days of delivery.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-serif text-stone-900 font-medium">4. Returns & Exchanges</h2>
                        <p>
                            Standard off-the-rack garments in unused, unwashed condition with original tags intact may be exchanged or returned within 7 calendar days of receipt. Custom-monogrammed pieces are covered under our alteration guarantee.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-serif text-stone-900 font-medium">5. Need Assistance?</h2>
                        <div className="p-4 bg-stone-100 rounded-xl flex flex-col sm:flex-row gap-4 sm:items-center text-xs sm:text-sm">
                            <span className="font-medium text-stone-900">Concierge Helpline: +91 88706 86660</span>
                            <span className="hidden sm:inline text-stone-400">•</span>
                            <span className="font-medium text-stone-900">Email: concierge@npclothings.com</span>
                        </div>
                    </section>
                </div>

                <div className="mt-14 pt-8 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                    <Link to="/terms" className="hover:text-stone-900 underline">Terms & Conditions</Link>
                    <Link to="/privacy" className="hover:text-stone-900 underline">Privacy Policy</Link>
                    <Link to="/contact" className="hover:text-stone-900 underline">Contact Concierge</Link>
                </div>
            </div>
        </Layout>
    );
}

