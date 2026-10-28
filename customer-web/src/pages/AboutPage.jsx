import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { Link } from 'react-router-dom';
import { Scissors, Sparkles, Feather } from 'lucide-react';

export default function AboutPage() {
    return (
        <Layout>
            <Seo
                title="About NP Clothings — The Atelier Story"
                description="The heritage and craftsmanship behind NP Clothings, India's bespoke quiet luxury menswear atelier."
            />
            <div className="max-w-4xl mx-auto px-6 py-14 sm:py-20">
                <div className="mb-14 text-center">
                    <span className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] font-semibold block mb-2">
                        Our Heritage
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-serif text-stone-900 font-light tracking-wide mb-4">
                        The Quiet Luxury Atelier
                    </h1>
                    <p className="text-sm sm:text-base text-stone-500 max-w-xl mx-auto leading-relaxed">
                        Timeless pieces engineered for the considered wardrobe. No loud branding, only heirloom fabrics, master tailoring, and personal fit.
                    </p>
                </div>

                <div className="space-y-12 text-stone-700 text-sm sm:text-[15px] leading-relaxed">
                    <section className="bg-stone-50 border border-stone-200 rounded-2xl p-8 sm:p-10 space-y-4">
                        <h2 className="text-xl font-serif text-stone-900 font-medium">Bespoke Mastery</h2>
                        <p>
                            At NP Clothings, we believe true luxury whispers. Founded on the principle of bespoke tailoring, every shirt is crafted individually — from precision hand-drafted patterns to artisanal single-needle stitching.
                        </p>
                        <p>
                            Our signature <strong>Chinese collar</strong> and <strong>mandarin collar</strong> designs combine traditional clean lines with contemporary tailored ease, offering discerning gentlemen an effortless presence for both corporate boardrooms and evening celebrations.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="p-6 bg-white border border-stone-200 rounded-xl">
                            <Scissors className="w-6 h-6 text-[#c9a96e] mb-3" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900 mb-1.5">
                                Made to Measure
                            </h3>
                            <p className="text-xs text-stone-500 leading-relaxed">
                                Personalized neck, sleeve, and shoulder dimensions with customizable collar and button options.
                            </p>
                        </div>
                        <div className="p-6 bg-white border border-stone-200 rounded-xl">
                            <Sparkles className="w-6 h-6 text-[#c9a96e] mb-3" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900 mb-1.5">
                                Heirloom Linen
                            </h3>
                            <p className="text-xs text-stone-500 leading-relaxed">
                                100% pure European flax linen and Egyptian Giza cotton weaves that soften gracefully with every wash.
                            </p>
                        </div>
                        <div className="p-6 bg-white border border-stone-200 rounded-xl">
                            <Feather className="w-6 h-6 text-[#c9a96e] mb-3" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900 mb-1.5">
                                Pan-India Reach
                            </h3>
                            <p className="text-xs text-stone-500 leading-relaxed">
                                Insured doorstep delivery across 25,000+ pin codes with dedicated alterations concierge support.
                            </p>
                        </div>
                    </div>

                    <div className="text-center pt-8">
                        <Link
                            to="/shop"
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-[0.2em] font-medium rounded-lg shadow-sm transition-all"
                        >
                            <span>Explore The Collection</span>
                            <span>→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

