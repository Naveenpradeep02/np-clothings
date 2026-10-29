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
  Shirt,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";

export default function HomePage() {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

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

  // 1. High-Fashion Editorial Wardrobe Capsules (Image-Led)
  const EDITORIAL_CAPSULES = [
    {
      num: "I",
      title: "Signature Chinese Collar",
      fabric: "Architectural Mandarin Band",
      desc: "Engineered with a clean 3.2cm upright stand collar that frames the neck without stiffness.",
      image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=85",
      link: "/shop?q=chinese-collar",
      tag: "Signature Cut",
    },
    {
      num: "II",
      title: "Pure European Heirloom Linen",
      fabric: "100% Certified French Flax",
      desc: "Naturally temperature-regulating weave garment-washed to achieve an unbroken, fluid drape.",
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=85",
      link: "/shop?category=casual-linen",
      tag: "Heirloom Weave",
    },
    {
      num: "III",
      title: "2-Ply Giza Egyptian Cotton",
      fabric: "Bespoke Business Poplin",
      desc: "Woven from long-staple Giza 87 yarns offering a crisp, featherweight touch with boardroom sheen.",
      image: "https://images.unsplash.com/photo-1620012253295-c15c429f6b9b?auto=format&fit=crop&w=900&q=85",
      link: "/shop?category=formal-shirts",
      tag: "Made-to-Measure",
    },
    {
      num: "IV",
      title: "Sartorial Pleated Trousers",
      fabric: "Italian Wool & Cotton Blend",
      desc: "High-waisted tailoring with discrete side adjusters, clean forward pleats, and elegant taper.",
      image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=85",
      link: "/shop?category=trousers",
      tag: "Artisanal Drape",
    },
  ];

  // Curated fallback garments if API returns empty
  const FALLBACK_PRODUCTS = [
    {
      id: "np-01",
      slug: "mandarin-white-linen",
      name: "The Mandarin Band White Linen",
      brand_name: "NP Bespoke",
      category_name: "Heirloom Linen",
      min_price: 3499,
      primary_image: {
        url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=85",
      },
    },
    {
      id: "np-02",
      slug: "chinese-stand-azure",
      name: "The Stand Collar Azure Poplin",
      brand_name: "NP Sartorial",
      category_name: "Egyptian Cotton",
      min_price: 3899,
      primary_image: {
        url: "https://images.unsplash.com/photo-1620012253295-c15c429f6b9b?auto=format&fit=crop&w=800&q=85",
      },
    },
    {
      id: "np-03",
      slug: "natural-stone-linen",
      name: "Natural Stone Pure Flax Shirt",
      brand_name: "NP Atelier",
      category_name: "Heirloom Linen",
      min_price: 3699,
      primary_image: {
        url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=85",
      },
    },
    {
      id: "np-04",
      slug: "midnight-bespoke-trousers",
      name: "Midnight Pleated Wool Trousers",
      brand_name: "NP Tailoring",
      category_name: "Tailored Trousers",
      min_price: 4499,
      primary_image: {
        url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=85",
      },
    },
  ];

  const displayedProducts = products.length > 0 ? products : FALLBACK_PRODUCTS;

  // 2. Client Testimonials
  const REVIEWS = [
    {
      quote: "The Chinese stand collar is unmatched. Most brands have collars that collapse by noon, but NP's architecture holds its form with zero constriction. The linen feels like an heirloom piece.",
      author: "Aditya Vardhan",
      location: "Bangalore",
      role: "Architect & Partner",
    },
    {
      quote: "Single-needle stitching, Australian mother-of-pearl buttons, and customized sleeve taper. The made-to-measure process took 5 minutes online and arrived fitting better than Savile Row RTW.",
      author: "Dr. Siddharth Menon",
      location: "Chennai",
      role: "Cardiac Surgeon",
    },
    {
      quote: "Whispered luxury done right. No logos, just impeccable Giza cotton and a collar drape that draws quiet compliments in every boardroom meeting.",
      author: "Rajesh K. Singhania",
      location: "Mumbai",
      role: "Private Equity Principal",
    },
  ];

  // 3. Homepage Top FAQs
  const HOME_FAQS = [
    {
      q: "What defines the NP signature Chinese and mandarin collar architecture?",
      a: "Our proprietary stand collar is engineered with a bespoke internal canvas interlining cut on a 45-degree bias. This provides a clean, upright architectural structure that frames the jawline gracefully without ever pinching the throat or requiring a necktie.",
    },
    {
      q: "How does Made-to-Measure personalization work online?",
      a: "You can select standard collar sizes (38 to 46) or enter your custom neck, shoulder, chest, and sleeve dimensions directly on any product page. Our master cutters in Tirupur draft a personal pattern, and your dimensions are archived for seamless future reorders.",
    },
    {
      q: "Where are your heirloom linens and Egyptian cotton fabrics sourced?",
      a: "We source certified 100% pure European flax from Normandy, France, and 2-ply long-staple Giza 87 cotton weaves. Zero synthetic blends are used across our garments.",
    },
    {
      q: "What is the dispatch timeline and alteration guarantee?",
      a: "Ready-to-wear shirts ship within 24–48 hours; bespoke pieces ship within 4–7 business days via insured express couriers across 25,000+ pin codes. If minor adjustments are needed, our concierge coordinates complimentary alterations within 7 days.",
    },
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

      <div className="flex-1 bg-[#fbf9f5]">
        {/* ========================================================================= */}
        {/* 1. EDITORIAL HERO: Cinematic Campaign with High-Fashion Art Direction     */}
        {/* ========================================================================= */}
        <section className="relative w-full overflow-hidden bg-[#121110] text-white">
          <div className="relative h-[86vh] min-h-[580px] max-h-[960px] w-full overflow-hidden">
            <video
              src={heroVideo}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-85 pointer-events-none"
            />

            {/* Subtle atmospheric gradient overlay for magazine contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121110] via-transparent to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/50 pointer-events-none" />

            {/* Editorial Layout Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16 max-w-7xl mx-auto">
              {/* Top Editorial Monogram & Season Callout */}
              <div className="flex items-center justify-between text-xs tracking-editorial uppercase text-[#c5a880] font-medium pt-2">
                <span>Atelier Archive &bull; Vol. IV</span>
                <span className="hidden sm:inline">Handmade in Tirupur, India</span>
              </div>

              {/* Bottom Editorial Masthead & Action Callout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-4">
                <div className="lg:col-span-8 space-y-3">
                  <span className="inline-block text-[11px] uppercase tracking-editorial text-[#c5a880] font-semibold">
                    The Considered Wardrobe
                  </span>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light font-editorial tracking-tight text-white leading-[1.02]">
                    Quiet Luxury. <br />
                    <span className="font-editorial-italic font-normal text-[#f4ecdc]">
                      Architectural Collars.
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-300 font-light max-w-lg leading-relaxed pt-1">
                    Signature Chinese stand and mandarin collars crafted in pure European flax linen and 2-ply Egyptian cotton. Made-to-measure personalization with single-needle precision.
                  </p>
                </div>

                <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3.5 pt-2">
                  <Link
                    to="/shop"
                    className="w-full sm:w-auto lg:w-full text-center px-8 py-3.5 bg-white text-[#121110] hover:bg-[#f4ecdc] text-xs uppercase tracking-luxury font-medium transition-all duration-300 shadow-lg"
                  >
                    <span>Explore Capsule Collection &rarr;</span>
                  </Link>

                  <Link
                    to="/about"
                    className="w-full sm:w-auto lg:w-full text-center px-8 py-3.5 border border-white/30 hover:border-white text-white text-xs uppercase tracking-luxury font-medium transition-all duration-300 backdrop-blur-xs"
                  >
                    <span>The Atelier Story</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. CURATED CAPSULES: Image-Led High-Fashion Menswear Collections          */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-18">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-5 border-b border-[#e8e4dc] gap-4">
            <div>
              <span className="text-xs uppercase tracking-editorial text-[#b38e5d] font-semibold block mb-1">
                Wardrobe Editions
              </span>
              <h2 className="text-2xl sm:text-3xl font-editorial font-light text-[#121110] tracking-wide">
                Curated Menswear Capsules
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 font-light max-w-md leading-relaxed">
              Each capsule is crafted in limited numbers, emphasizing pure natural textiles, balanced collar heights, and effortless presence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {EDITORIAL_CAPSULES.map((item, idx) => (
              <Link
                key={idx}
                to={item.link}
                className={`group block editorial-hover-card bg-white border border-[#e8e4dc] p-3 transition-all reveal-on-scroll delay-${(idx + 1) * 100}`}
              >
                {/* Image Frame with Aspect 3:4 */}
                <div className="aspect-[3/4] editorial-image-card relative mb-4 overflow-hidden bg-stone-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-xs text-white text-[9px] uppercase tracking-luxury font-medium">
                    <span>{item.num}</span>
                    <span>&bull;</span>
                    <span>{item.tag}</span>
                  </div>
                </div>

                {/* Typography & Fabric Metadata */}
                <div className="px-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-editorial text-[#b38e5d] font-semibold">
                      {item.fabric}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#b38e5d] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>

                  <h3 className="text-base font-editorial font-medium text-[#121110] group-hover:text-[#b38e5d] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-stone-500 font-light leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>

                  <div className="pt-2">
                    <span className="text-[11px] uppercase tracking-luxury text-[#121110] group-hover:text-[#b38e5d] font-medium luxury-underline">
                      Explore Edition
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. RUNWAY RELEASES: Editorial Product Showcase                            */}
        {/* ========================================================================= */}
        <section className="bg-white border-y border-[#e8e4dc] py-14 sm:py-18">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-5 border-b border-[#e8e4dc] gap-4">
              <div>
                <span className="text-xs uppercase tracking-editorial text-[#b38e5d] font-semibold block mb-1">
                  Atelier Catalog
                </span>
                <h2 className="text-2xl sm:text-3xl font-editorial font-light text-[#121110] tracking-wide">
                  Runway Capsule Releases
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 font-light mt-1">
                  Individual made-to-measure tailoring with complimentary doorstep alterations.
                </p>
              </div>

              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-luxury font-medium text-[#121110] hover:text-[#b38e5d] transition-colors group"
              >
                <span>View Full Archive</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="animate-pulse space-y-3">
                    <div className="aspect-[3/4] bg-stone-100"></div>
                    <div className="h-4 bg-stone-100 w-2/3"></div>
                    <div className="h-3 bg-stone-100 w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {displayedProducts.slice(0, 4).map((p, idx) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.slug || p.id}`}
                    className={`group block editorial-hover-card bg-[#fcfbf9] border border-[#e8e4dc] p-3 transition-all reveal-on-scroll delay-${(idx + 1) * 100}`}
                  >
                    <div className="aspect-[3/4] editorial-image-card relative mb-3 bg-stone-100 overflow-hidden">
                      {p.primary_image?.url ? (
                        <img
                          src={p.primary_image.url}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs tracking-widest uppercase p-4 text-center">
                          <Shirt className="w-8 h-8 mb-2 stroke-[1.2] text-stone-300" />
                          <span>NP Clothings</span>
                        </div>
                      )}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-white text-[9px] uppercase tracking-luxury font-medium">
                        Bespoke
                      </span>
                    </div>

                    <div className="px-1 space-y-1">
                      <p className="text-[10px] uppercase tracking-editorial text-[#b38e5d] font-semibold truncate">
                        {[p.category_name, p.brand_name].filter(Boolean).join(" &bull; ") || "Artisanal Tailoring"}
                      </p>

                      <h3 className="text-sm font-editorial font-medium text-[#121110] group-hover:text-[#b38e5d] transition-colors truncate">
                        {p.name}
                      </h3>

                      {p.min_price != null && (
                        <p className="text-xs sm:text-sm font-semibold text-[#121110] pt-0.5">
                          ₹{Number(p.min_price).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. THE BESPOKE STUDIO: Architectural Sartorial Blueprint Layout            */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-18">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Sartorial Technical Narrative */}
            <div className="lg:col-span-6 space-y-6 reveal-from-left">
              <div>
                <span className="text-xs uppercase tracking-editorial text-[#b38e5d] font-semibold block mb-1.5">
                  Artisanal Dossier
                </span>
                <h2 className="text-3xl sm:text-4xl font-editorial font-light text-[#121110] leading-tight">
                  Anatomy of an <br />
                  <span className="font-editorial-italic font-normal">NP Bespoke Shirt.</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 font-light mt-2 leading-relaxed max-w-lg">
                  Every garment is hand-drafted individually at our Tirupur atelier. We do not use standard mass industrial patterns.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex gap-4 p-4 bg-white border border-[#e8e4dc]">
                  <div className="w-8 h-8 rounded-full bg-[#f4ecdc] text-[#9c7746] font-serif font-medium text-sm flex items-center justify-center shrink-0">
                    01
                  </div>
                  <div>
                    <h3 className="text-sm font-editorial font-semibold text-[#121110]">
                      Architectural Stand Collar
                    </h3>
                    <p className="text-xs text-stone-500 font-light leading-relaxed mt-0.5">
                      Cut on a 45&deg; bias with light horsehair canvas interlining, ensuring an elegant upright stand without pinching.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-white border border-[#e8e4dc]">
                  <div className="w-8 h-8 rounded-full bg-[#f4ecdc] text-[#9c7746] font-serif font-medium text-sm flex items-center justify-center shrink-0">
                    02
                  </div>
                  <div>
                    <h3 className="text-sm font-editorial font-semibold text-[#121110]">
                      Natural Australian Mother-of-Pearl
                    </h3>
                    <p className="text-xs text-stone-500 font-light leading-relaxed mt-0.5">
                      Cross-stitched and shanked by hand to glide smoothly through buttonholes. Concealed snap-press options available.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-white border border-[#e8e4dc]">
                  <div className="w-8 h-8 rounded-full bg-[#f4ecdc] text-[#9c7746] font-serif font-medium text-sm flex items-center justify-center shrink-0">
                    03
                  </div>
                  <div>
                    <h3 className="text-sm font-editorial font-semibold text-[#121110]">
                      22-Stitches-Per-Inch French Seams
                    </h3>
                    <p className="text-xs text-stone-500 font-light leading-relaxed mt-0.5">
                      Single-needle craftsmanship with micro-stitched side gussets prevents puckering and ensures a clean interior finish.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#121110] text-white hover:bg-black text-xs uppercase tracking-luxury font-medium transition-colors"
                >
                  <span>Commission Your Fit</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#c5a880]" />
                </Link>
              </div>
            </div>

            {/* Right: Atelier Visual Blueprint */}
            <div className="lg:col-span-6 reveal-from-right">
              <div className="relative border border-[#e8e4dc] bg-white p-3 shadow-sm">
                <div className="aspect-[4/5] editorial-image-card relative overflow-hidden bg-stone-100">
                  <img
                    src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=85"
                    alt="Master tailor chalking bespoke linen pattern"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <span className="text-[10px] uppercase tracking-editorial text-[#c5a880] font-semibold block">
                      Tirupur Tailoring House
                    </span>
                    <p className="text-lg font-editorial font-light leading-snug">
                      "A shirt must adapt to the wearer&apos;s posture, never force posture to adapt to the shirt."
                    </p>
                    <p className="text-[11px] text-stone-300 font-light pt-1">
                      &mdash; Master Cutting Room, NP Clothings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. EDITORIAL SPREAD: The Heritage & Sourcing Monograph                    */}
        {/* ========================================================================= */}
        <section className="bg-[#121110] text-[#f7f5f0] py-16 sm:py-20 border-y border-stone-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-4 reveal-from-left">
                <span className="text-xs uppercase tracking-editorial text-[#c5a880] font-semibold block">
                  Heritage Manifesto &bull; Tirupur
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-editorial font-light text-white leading-tight">
                  No Loud Logos. <br />
                  <span className="font-editorial-italic text-[#f4ecdc]">Only Handcrafted Dignity.</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-xl">
                  We founded NP Clothings on the conviction that true luxury never shouts. Our garments are drafted by generational artisans in South India using certified European flax and Giza cotton, finished with clean seams that feel softer each time they are worn.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-800 text-xs">
                  <div>
                    <p className="text-[#c5a880] font-editorial text-lg">100%</p>
                    <p className="text-stone-300 font-light text-[11px] uppercase tracking-wider">Natural Fibres Only</p>
                  </div>
                  <div>
                    <p className="text-[#c5a880] font-editorial text-lg">25,000+</p>
                    <p className="text-stone-300 font-light text-[11px] uppercase tracking-wider">Indian Pin Codes Covered</p>
                  </div>
                  <div>
                    <p className="text-[#c5a880] font-editorial text-lg">7 Days</p>
                    <p className="text-stone-300 font-light text-[11px] uppercase tracking-wider">Complimentary Alteration</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#1a1918] border border-stone-800 p-7 space-y-6 reveal-from-right">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#121110] border border-stone-800 flex items-center justify-center text-[#c5a880] shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-0.5">
                      Traceable Fabric Weaves
                    </h3>
                    <p className="text-xs text-stone-400 font-light leading-relaxed">
                      Every roll of linen and cotton arrives with certified purity documentation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#121110] border border-stone-800 flex items-center justify-center text-[#c5a880] shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-0.5">
                      Insured Transit & Garment Bags
                    </h3>
                    <p className="text-xs text-stone-400 font-light leading-relaxed">
                      Packaged in breathable fabric cases to preserve pristine collar drape during transit.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#121110] border border-stone-800 flex items-center justify-center text-[#c5a880] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-0.5">
                      Direct Concierge Line
                    </h3>
                    <p className="text-xs text-stone-400 font-light leading-relaxed">
                      Consult directly on WhatsApp (+91 88706 86660) for fit advice and wedding capsule sizing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. CONNOISSEURS VOICES: Verified Editorial Testimonials                   */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-18">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-5 border-b border-[#e8e4dc] gap-4">
            <div>
              <span className="text-xs uppercase tracking-editorial text-[#b38e5d] font-semibold block mb-1">
                Client Experiences
              </span>
              <h2 className="text-2xl sm:text-3xl font-editorial font-light text-[#121110] tracking-wide">
                The Connoisseurs Club
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 font-light max-w-sm">
              Reflections from patrons who wear NP bespoke shirts across India and abroad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((r, idx) => (
              <div
                key={idx}
                className={`p-7 bg-white border border-[#e8e4dc] flex flex-col justify-between editorial-hover-card reveal-on-scroll delay-${(idx + 1) * 150}`}
              >
                <div>
                  <div className="flex items-center gap-1 text-[#b38e5d] mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#b38e5d]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-[13px] text-stone-700 font-light leading-relaxed italic mb-6">
                    &ldquo;{r.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-[#121110]">{r.author}</p>
                    <p className="text-[11px] text-stone-500 font-light">{r.role} &bull; {r.location}</p>
                  </div>
                  <span className="text-[9px] uppercase tracking-luxury text-[#9c7746] font-medium bg-[#faf7f0] border border-[#e8d7b8] px-2 py-0.5">
                    Verified Fit
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FREQUENTLY ASKED QUESTIONS: Minimalist Hairline Accordions             */}
        {/* ========================================================================= */}
        <section className="bg-[#f7f4ee] border-t border-[#e8e4dc] py-14 sm:py-18">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-10 reveal-on-scroll">
              <span className="text-xs uppercase tracking-editorial text-[#b38e5d] font-semibold block mb-1">
                Sartorial Guidance
              </span>
              <h2 className="text-2xl sm:text-3xl font-editorial font-light text-[#121110] tracking-wide">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {HOME_FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`transition-all duration-300 border bg-white ${
                      isOpen
                        ? "border-[#c5a880] shadow-xs"
                        : "border-[#e8e4dc] hover:border-stone-400"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      className="w-full text-left px-6 py-4.5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    >
                      <span className="text-xs sm:text-sm font-editorial font-medium text-[#121110]">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-[#b38e5d]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-0 text-xs sm:text-[13px] text-stone-600 font-light leading-relaxed border-t border-stone-100">
                        <p className="pt-3">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs">
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#121110] hover:bg-black text-white uppercase tracking-luxury font-medium transition-colors"
              >
                <span>Full Bespoke Guide</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#c5a880]" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 border border-stone-300 bg-white text-stone-800 uppercase tracking-luxury font-medium transition-colors hover:border-[#121110]"
              >
                <span>Contact Concierge Desk</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
