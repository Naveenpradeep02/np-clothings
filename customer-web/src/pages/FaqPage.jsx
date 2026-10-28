import { useState } from 'react';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { Link } from 'react-router-dom';
import {
    ChevronDown,
    HelpCircle,
    Scissors,
    Sparkles,
    Truck,
    RotateCcw,
    CreditCard,
    Phone,
    MessageSquare,
} from 'lucide-react';

export default function FaqPage() {
    const [openIndex, setOpenIndex] = useState(0);

    const FAQ_ITEMS = [
        {
            category: "Customization",
            question: "Can I customize collar styles and button types on any shirt?",
            answer: "Yes, absolutely. NP Clothings is built around bespoke individuality. When selecting any shirt, you can choose between our signature Chinese stand collar, refined mandarin band, or classic spread collar. You can also customize your button closure — opting for contemporary snap press buttons or iridescent mother-of-pearl buttons."
        },
        {
            category: "Sizing",
            question: "How does Made-to-Measure sizing work?",
            answer: "We offer both standard ready-to-wear sizes (38 to 46) and custom Made-to-Measure. You can enter your specific neck circumference, chest width, sleeve length, and shoulder dimensions directly on the product page. Our master cutters will draft a custom pattern for you, and your dimensions will be archived in your profile for seamless future reorders."
        },
        {
            category: "Fabrics",
            question: "What fabrics do you use for your shirts?",
            answer: "We use 100% pure natural heirloom textiles with zero synthetic blends. Our collections feature certified European flax linen (naturally breathable and garment-softened) and premium 2-ply Egyptian Giza cotton weaves that retain a crisp, lustrous drape wash after wash."
        },
        {
            category: "Shipping",
            question: "How long does pan-India delivery take?",
            answer: "Ready-to-wear items dispatch within 24–48 business hours and arrive in 3–5 days. Bespoke Made-to-Measure pieces undergo single-needle tailoring and typically ship in 4–7 business days via insured express couriers serving over 25,000+ pin codes across India."
        },
        {
            category: "Alterations",
            question: "What is your Perfect Fit Guarantee & Alterations Policy?",
            answer: "We want every shirt to feel made exclusively for you. If your garment needs minor fit adjustments (such as sleeve length, collar circumference, or waist taper), our styling concierge coordinates complimentary alterations within 7 days of package delivery."
        },
        {
            category: "Payments",
            question: "What payment methods do you accept? Is COD available?",
            answer: "We accept all major payment modes including UPI (Google Pay, PhonePe, Paytm), Credit & Debit cards (Visa, Mastercard, RuPay), and NetBanking via RBI-compliant 256-bit encrypted gateways. Cash on Delivery (COD) is also supported across eligible Indian pin codes."
        },
        {
            category: "Care",
            question: "How should I care for pure linen and Giza cotton shirts?",
            answer: "For pure linen, machine wash on a gentle cold cycle with mild detergent or hand wash. Hang dry in shade while slightly damp to avoid harsh creasing. For Egyptian cotton, warm iron while slightly damp for that crisp, luxury boardroom finish."
        },
        {
            category: "Concierge",
            question: "Can I order custom shirts for weddings or groomsmen?",
            answer: "Yes! We frequently design tailored capsule wardrobes for grooms, wedding parties, and corporate gifting. Please contact our styling concierge on WhatsApp at +91 88706 86660 or email concierge@npclothings.com to discuss fabric swatches and group sizing."
        }
    ];

    function toggleFaq(index) {
        setOpenIndex(openIndex === index ? -1 : index);
    }

    return (
        <Layout>
            <Seo
                title="Frequently Asked Questions — NP Clothings"
                description="Find answers about bespoke tailoring, signature Chinese collars, linen care, sizing, and pan-India delivery."
            />
            <div className="max-w-4xl mx-auto px-6 py-14 sm:py-20">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <span className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] font-semibold block mb-2">
                        Help &amp; Guidance
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 font-light tracking-wide">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-500 font-light mt-3 leading-relaxed">
                        Everything you need to know about our bespoke shirts, collar architecture, sizing, and pan-India delivery.
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-4">
                    {FAQ_ITEMS.map((item, idx) => {
                        const isOpen = openIndex === idx;
                        return (
                            <div
                                key={idx}
                                className={`border rounded-2xl transition-all duration-300 overflow-hidden reveal-on-scroll delay-${((idx % 4) + 1) * 100} ${
                                    isOpen
                                        ? "bg-white border-stone-300 shadow-md ring-1 ring-stone-200"
                                        : "bg-white/70 border-stone-200/80 hover:border-stone-300 hover:shadow-sm"
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                                    aria-expanded={isOpen}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                                            {item.category}
                                        </span>
                                        <span className="text-sm sm:text-base font-serif font-medium text-stone-900">
                                            {item.question}
                                        </span>
                                    </div>
                                    <ChevronDown
                                        className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-300 ${
                                            isOpen ? "rotate-180 text-[#a37d32]" : ""
                                        }`}
                                    />
                                </button>

                                {isOpen && (
                                    <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-stone-600 font-light leading-relaxed border-t border-stone-100 animate-in fade-in duration-300">
                                        <p>{item.answer}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Direct Help Desk Box */}
                <div className="mt-16 p-8 bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left reveal-on-scroll luxury-card-hover">
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.25em] text-[#c9a96e] font-semibold block mb-1">
                            Still have questions?
                        </span>
                        <h3 className="text-lg font-serif text-white font-medium">
                            Speak Directly with our Styling Concierge
                        </h3>
                        <p className="text-xs text-stone-400 font-light mt-1">
                            Available Monday to Saturday from 10:00 AM to 7:00 PM IST.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 shrink-0">
                        <a
                            href="https://wa.me/918870686660?text=Hi%20NP%20Clothings,%20I%20have%20a%20question%20about%20your%20shirts."
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium tracking-wide transition-colors"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp Concierge</span>
                        </a>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-stone-950 hover:bg-stone-100 rounded-lg text-xs font-medium tracking-wide transition-colors"
                        >
                            <span>Contact Form</span>
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

