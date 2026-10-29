import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Seo from "../components/Seo";
import { fetchHomePage, fetchStorefrontProducts } from "../services/api";
import heroVideo from "../assets/Man_walking_and_changing_appearance_20261010142342.mp4";
import {
  Scissors,
  Sparkles,
  ShieldCheck,
  Truck,
  ArrowRight,
  Star,
  CheckCircle,
  Layers,
  Shirt,
  ChevronDown,
} from "lucide-react";

export default function HomePage() {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoFinished, setVideoFinished] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  useEffect(() => {
    document.title = "NP Clothings — Quiet Luxury Menswear";
  }, []);

  // Show text smoothly after hero video finishes (duration is ~8.2 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoFinished(true);
    }, 8200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Load CMS sections and featured products concurrently
    Promise.allSettled([fetchHomePage(), fetchStorefrontProducts({ limit: 4 })])
      .then(([homeRes, prodRes]) => {
        if (cancelled) return;
        if (homeRes.status === "fulfilled") {
          setSections(homeRes.value.data?.sections || []);
        }
        if (prodRes.status === "fulfilled") {
          setProducts(prodRes.value.data || []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unable to load homepage");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 1. Curated Categories / Capsule Collections
  const CAPSULES = [
    {
      title: "Signature Chinese Collar",
      subtitle: "Mandarin band collars engineered for modern distinction.",
      link: "/shop?q=chinese-collar",
      badge: "Signature Cut",
      bgColor: "bg-stone-200/60",
    },
    {
      title: "Pure Heirloom Linen",
      subtitle: "100% European flax weaves for effortless breathability.",
      link: "/shop?category=casual-linen",
      badge: "Heirloom Weave",
      bgColor: "bg-amber-100/40",
    },
    {
      title: "Bespoke Business Formals",
      subtitle: "Egyptian Giza cotton poplin crafted for boardroom authority.",
      link: "/shop?category=formal-shirts",
      badge: "Made-to-Measure",
      bgColor: "bg-slate-200/50",
    },
    {
      title: "Tailored Trousers & Chinos",
      subtitle: "Precision-tapered pants with clean made-to-measure drapes.",
      link: "/shop?category=trousers",
      badge: "Artisanal Fit",
      bgColor: "bg-neutral-200/60",
    },
  ];

  // 2. Client Testimonials
  const REVIEWS = [
    {
      quote:
        "The Chinese collar linen shirt has the most flattering neckline drape I've found in India. Impeccable single-needle stitching.",
      author: "Siddharth R.",
      location: "Chennai",
      piece: "Signature Chinese Collar Linen Shirt",
    },
    {
      quote:
        "Press button closure with tailored Egyptian cotton is pure genius for boardroom wear. Truly quiet luxury with zero loud logos.",
      author: "Arjun M.",
      location: "Bengaluru",
      piece: "Bespoke Egyptian Poplin Shirt",
    },
    {
      quote:
        "Ordered a custom wedding capsule for our groomsmen. The concierge WhatsApp support and fit adjustments were exceptionally smooth.",
      author: "Vikram S.",
      location: "Mumbai",
      piece: "Made-to-Measure Formal Capsule",
    },
  ];

  // 3. Homepage Top FAQs
  const HOME_FAQS = [
    {
      q: "Can I customize collar styles and button types on any shirt?",
      a: "Yes. Every garment in our collection allows you to select signature Chinese collars, refined mandarin bands, or classic spread collars, along with concealed snap press buttons or mother-of-pearl buttons."
    },
    {
      q: "How does Made-to-Measure sizing work?",
      a: "You can select standard ready-to-wear sizes (38 to 46) or enter your custom neck, chest, sleeve, and shoulder dimensions. Your tailoring profile is saved for seamless future orders."
    },
    {
      q: "What fabrics do you use for your shirts?",
      a: "We exclusively source 100% pure natural heirloom fabrics — certified European flax linen and 2-ply Egyptian Giza cotton weaves with zero synthetic blends."
    },
    {
      q: "How long does pan-India delivery take?",
      a: "Ready-to-wear pieces dispatch within 24–48 hours and arrive in 3–5 days. Bespoke Made-to-Measure shirts dispatch within 4–7 business days via insured express couriers across 25,000+ pin codes."
    },
    {
      q: "What is your Perfect Fit Guarantee & Alterations Policy?",
      a: "If your garment requires minor fit adjustments, our styling concierge coordinates complimentary alterations within 7 days of package delivery."
    }
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <Layout>
      <Seo
        title="NP Clothings — Quiet Luxury Menswear & Bespoke Shirts"
        description="Handcrafted quiet luxury menswear. Signature Chinese and mandarin collar shirts tailored in pure European linen and Egyptian cotton."
        canonical="https://npclothings.com/"
        jsonLd={faqJsonLd}
      />
      <div className="flex-1">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION: Video Background with Smooth Text Reveal                */}
        {/* ========================================================================= */}
        <section className="relative w-full overflow-hidden bg-white">
          <div className="relative h-[85vh] min-h-[520px] max-h-[920px] w-full overflow-hidden">
            <video
              src={heroVideo}
              autoPlay
              muted
              playsInline
              onEnded={() => setVideoFinished(true)}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Right Side: QUIET LUXURY Heading (2 lines), Description & Button */}
            <div
              className={`absolute right-6 sm:right-10 md:right-14 lg:right-20 top-[38%] sm:top-[40%] md:top-[42%] -translate-y-1/2 z-10 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[400px] flex flex-col items-end text-right transition-all duration-1000 delay-150 ease-out ${
                videoFinished
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6 pointer-events-none"
              }`}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-neutral-900 uppercase font-serif leading-[1.0] mb-2.5 sm:mb-3 text-right">
                QUIET<br />LUXURY
              </h1>
              <div className="max-w-[250px] sm:max-w-[280px] text-right space-y-1.5 mb-4 sm:mb-5">
                <p className="text-xs sm:text-[13px] text-neutral-700 font-light leading-relaxed">
                  Crafted for the discerning individual. Signature Chinese &amp; mandarin collars tailored in pure heirloom linen and Egyptian cotton.
                </p>
                <p className="text-[11px] sm:text-xs text-[#a37d32] font-medium tracking-wide">
                  ✦ Made-to-Measure • Pan-India Delivery
                </p>
              </div>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 bg-neutral-900 hover:bg-black text-white text-[11px] sm:text-xs tracking-[0.2em] uppercase font-medium shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer shrink-0"
              >
                <span>Explore Collection</span>
                <span className="text-sm">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. CURATED CAPSULES: Categories Showcase                                  */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="text-center max-w-xl mx-auto mb-14 reveal-on-scroll">
            <span className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] font-semibold block mb-2">
              Atelier Collections
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 font-light tracking-wide">
              Curated Wardrobe Capsules
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-light mt-2 leading-relaxed">
              Timeless silhouettes designed with signature collar architecture and pure natural fabrics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CAPSULES.map((item, idx) => (
              <Link
                key={idx}
                to={item.link}
                className={`group relative flex flex-col justify-between p-7 rounded-2xl bg-white border border-stone-200/90 hover:border-stone-400 hover:shadow-xl luxury-card-hover reveal-on-scroll delay-${(idx + 1) * 100}`}
              >
                <div>
                  <span className="inline-block px-2.5 py-1 text-[10px] uppercase tracking-widest font-medium bg-stone-100 text-stone-600 rounded-md mb-6">
                    {item.badge}
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-normal text-stone-900 mb-2 group-hover:text-[#a37d32] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-500 font-light leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>

                <div className="pt-8 flex items-center gap-1.5 text-xs uppercase tracking-widest font-medium text-stone-900 group-hover:gap-2.5 transition-all">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#c9a96e]" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. FEATURED PRODUCTS: Runway Releases & New Arrivals                     */}
        {/* ========================================================================= */}
        <section className="bg-white border-y border-stone-200/80 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4 reveal-on-scroll">
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] font-semibold block mb-2">
                  New Arrivals
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 font-light tracking-wide">
                  Runway Capsule Releases
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 font-light mt-1">
                  Handcrafted in limited editions at our Tirupur tailoring atelier.
                </p>
              </div>

              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-stone-900 hover:text-[#a37d32] transition-colors group"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {loading ? (
              <p className="text-center py-16 text-xs text-stone-400 tracking-widest uppercase">
                Loading Garments…
              </p>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {products.map((p, idx) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.slug || p.id}`}
                    className={`group block luxury-card-hover reveal-on-scroll delay-${(idx + 1) * 100}`}
                  >
                    <div className="aspect-[3/4] bg-stone-100 rounded-xl mb-3.5 overflow-hidden border border-stone-200/70 relative">
                      {p.primary_image?.url ? (
                        <img
                          src={p.primary_image.url}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs tracking-widest uppercase p-4 text-center">
                          <Shirt className="w-6 h-6 mb-2 stroke-[1.2] text-stone-300" />
                          <span>NP Clothings</span>
                        </div>
                      )}

                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-stone-900/80 backdrop-blur-xs text-white text-[9px] uppercase tracking-widest rounded">
                        Bespoke
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-medium tracking-wide text-stone-900 group-hover:text-[#a37d32] transition-colors truncate">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                      {[p.category_name, p.brand_name].filter(Boolean).join(" · ") || "Tailored Shirt"}
                    </p>
                    {p.min_price != null && (
                      <p className="text-xs sm:text-sm font-medium text-stone-900 mt-1">
                        ₹{Number(p.min_price).toLocaleString("en-IN")}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200 reveal-on-scroll">
                <p className="text-sm text-stone-600 mb-3">
                  Explore our comprehensive made-to-measure collection in the store.
                </p>
                <Link
                  to="/shop"
                  className="inline-block px-6 py-2.5 bg-stone-900 hover:bg-black text-white text-xs tracking-widest uppercase rounded-lg transition-colors"
                >
                  Browse Store
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. THE BESPOKE STUDIO: Interactive Customization Highlights               */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="text-center max-w-xl mx-auto mb-14 reveal-on-scroll">
            <span className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] font-semibold block mb-2">
              The Art of Customization
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 font-light tracking-wide">
              Anatomy of an NP Shirt
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-light mt-2 leading-relaxed">
              Every detail is tailored to your taste — from signature collar styles to hand-sewn button closures.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-3 luxury-card-hover reveal-on-scroll delay-100">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-[#c9a96e]">
                <Shirt className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900">
                01. Collar Architecture
              </h3>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                Choose between our iconic Chinese stand collar, refined mandarin band, classic business spread, or Italian cutaway.
              </p>
            </div>

            <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-3 luxury-card-hover reveal-on-scroll delay-200">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-[#c9a96e]">
                <Scissors className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900">
                02. Button &amp; Placket
              </h3>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                Select minimal snap press buttons for a contemporary look or iridescent mother-of-pearl buttons with concealed plackets.
              </p>
            </div>

            <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-3 luxury-card-hover reveal-on-scroll delay-300">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-[#c9a96e]">
                <Sparkles className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900">
                03. Made-to-Measure
              </h3>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                Provide custom neck, chest, and sleeve measurements. Profiles are archived for seamless future reorders.
              </p>
            </div>

            <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-3 luxury-card-hover reveal-on-scroll delay-400">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-[#c9a96e]">
                <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900">
                04. Fit Guarantee
              </h3>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                Our styling concierge offers complimentary alterations within 7 days of delivery across all Indian metropolitan cities.
              </p>
            </div>
          </div>

          <div className="text-center mt-12 reveal-on-scroll delay-200">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-[0.2em] font-medium rounded-xl shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <span>Design Your Custom Garment</span>
              <ArrowRight className="w-4 h-4 text-[#c9a96e]" />
            </Link>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. EDITORIAL STORY BANNER: The Quiet Luxury Heritage                     */}
        {/* ========================================================================= */}
        <section className="bg-stone-900 text-stone-100 py-20 sm:py-24 border-y border-stone-800 overflow-hidden">
          <div className="mx-auto max-w-6xl px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-5 reveal-from-left">
              <span className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] font-semibold block">
                Atelier Heritage &bull; Tirupur, India
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-light text-white leading-tight">
                Whispered Luxury. Single-Needle Precision.
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-xl">
                At NP Clothings, we discard loud logos and ephemeral trends. Every garment is drafted and hand-tailored at our bespoke studio using 100% natural European linen and Giza cotton weaves that soften gracefully over years of wear.
              </p>

              <div className="pt-3 flex flex-wrap gap-4">
                <Link
                  to="/about"
                  className="px-6 py-3 bg-white text-stone-950 text-xs font-semibold uppercase tracking-widest rounded-lg hover:bg-stone-100 hover:shadow-lg transition-all duration-300"
                >
                  Our Heritage Story
                </Link>
                <Link
                  to="/contact"
                  className="px-6 py-3 border border-stone-700 text-stone-300 hover:text-white hover:border-stone-500 text-xs font-semibold uppercase tracking-widest rounded-lg transition-all duration-300"
                >
                  Consult Stylist Desk
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-stone-950/80 border border-stone-800 rounded-2xl p-7 space-y-6 reveal-from-right delay-200">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-[#c9a96e] shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-0.5">
                    Pure Natural Weaves
                  </h4>
                  <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                    Zero synthetic blends. Certified pure European flax linen and 2-ply Egyptian cotton.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-[#c9a96e] shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-0.5">
                    Pan-India Insured Dispatch
                  </h4>
                  <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                    Complimentary express doorstep delivery serving 25,000+ pin codes across India.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-[#c9a96e] shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-0.5">
                    Perfect Fit Guarantee
                  </h4>
                  <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                    Personal styling concierge with hassle-free size adjustments &amp; alteration support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. CONNOISSEURS VOICES: Verified Client Reviews                          */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="text-center max-w-xl mx-auto mb-14 reveal-on-scroll">
            <span className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] font-semibold block mb-2">
              Client Experiences
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 font-light tracking-wide">
              The Connoisseurs Club
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-light mt-2">
              Read what gentlemen across India say about their tailored NP Clothings garments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((r, idx) => (
              <div
                key={idx}
                className={`p-7 bg-white border border-stone-200/90 rounded-2xl shadow-xs flex flex-col justify-between luxury-card-hover reveal-on-scroll delay-${(idx + 1) * 150}`}
              >
                <div>
                  <div className="flex items-center gap-1 text-[#c9a96e] mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#c9a96e]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 font-light leading-relaxed italic mb-6">
                    &ldquo;{r.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-stone-900">{r.author}</p>
                    <p className="text-[11px] text-stone-500">{r.location}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-[#a37d32] font-medium bg-amber-50 px-2 py-1 rounded">
                    Verified Fit
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FREQUENTLY ASKED QUESTIONS: Interactive Accordion                     */}
        {/* ========================================================================= */}
        <section className="bg-stone-100/70 border-t border-stone-200/90 py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center max-w-xl mx-auto mb-14 reveal-on-scroll">
              <span className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] font-semibold block mb-2">
                Help &amp; Guidance
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 font-light tracking-wide">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-light mt-2">
                Quick answers regarding bespoke collars, heirloom fabrics, sizing, and pan-India shipping.
              </p>
            </div>

            <div className="space-y-3.5">
              {HOME_FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl transition-all duration-300 border luxury-card-hover reveal-on-scroll delay-${(idx + 1) * 100} ${
                      isOpen
                        ? "bg-white border-stone-300 shadow-sm"
                        : "bg-white/80 border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    >
                      <span className="text-xs sm:text-sm font-serif font-medium text-stone-900">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-[#a37d32]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-0 text-xs sm:text-[13px] text-stone-600 font-light leading-relaxed border-t border-stone-100 animate-in fade-in duration-200">
                        <p className="pt-3">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs reveal-on-scroll delay-150">
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-black text-white uppercase tracking-widest font-medium rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                <span>View Full FAQ &amp; Tailoring Guide</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#c9a96e]" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 border border-stone-300 hover:border-stone-400 bg-white text-stone-800 uppercase tracking-widest font-medium rounded-xl transition-all duration-300 hover:shadow-sm"
              >
                <span>Ask Stylist Desk</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
