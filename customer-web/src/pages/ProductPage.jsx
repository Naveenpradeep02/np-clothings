import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { fetchProduct, resolveVariant, fetchProductReviews, fetchProductRecommendations, submitProductReview, trackEvent, ApiError, addToCart, addToWishlist, } from '../services/api';
import { Eye, Star, Shirt, CircleDot, Layers, Scissors, RefreshCw, Search, Tag, Check, ShoppingBag, Heart } from 'lucide-react';

function getSampleTagIcon(alt = '') {
    const s = alt.toLowerCase();
    if (s.includes('collar')) return Shirt;
    if (s.includes('button')) return CircleDot;
    if (s.includes('placket')) return Layers;
    if (s.includes('cuff')) return Scissors;
    if (s.includes('front')) return Eye;
    if (s.includes('back')) return RefreshCw;
    if (s.includes('fabric')) return Search;
    return Tag;
}

function parseMeta(meta) {
    if (!meta)
        return {};
    if (typeof meta === 'string') {
        try {
            return JSON.parse(meta);
        }
        catch {
            return {};
        }
    }
    return meta;
}
export default function ProductPage() {
    const { idOrSlug } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    /** group_id → selected option_id */
    const [selected, setSelected] = useState({});
    const [resolved, setResolved] = useState(null);
    const [resolveError, setResolveError] = useState(null);
    const [resolving, setResolving] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [addedHint, setAddedHint] = useState(false);
    const [wishHint, setWishHint] = useState(false);
    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewTitle, setReviewTitle] = useState('');
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewMessage, setReviewMessage] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const productJsonLd = useMemo(() => {
        if (!product) return null;
        const price = resolved?.retail_price || product.min_price || 0;
        const primaryImg = product.images?.[0]?.url || 'https://npclothings.com/favicon.svg';
        return [
            {
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: product.name,
                description: product.seo_description || product.short_description || product.name,
                image: product.images?.map((im) => im.url) || [primaryImg],
                brand: {
                    '@type': 'Brand',
                    name: product.brand_name || 'NP Clothings',
                },
                offers: {
                    '@type': 'Offer',
                    url: `https://npclothings.com/product/${product.slug || product.id}`,
                    priceCurrency: 'INR',
                    price: Number(price),
                    availability: resolved && resolved.stock_quantity === 0
                        ? 'https://schema.org/OutOfStock'
                        : 'https://schema.org/InStock',
                },
            },
            {
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
                        name: 'Collections',
                        item: 'https://npclothings.com/shop',
                    },
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: product.name,
                        item: `https://npclothings.com/product/${product.slug || product.id}`,
                    },
                ],
            },
        ];
    }, [product, resolved]);
    useEffect(() => {
        if (!idOrSlug)
            return;
        setLoading(true);
        setError(null);
        fetchProduct(idOrSlug)
            .then((res) => {
            const p = res.data;
            setProduct(p);
            // Pre-select first option of each group
            const initial = {};
            for (const g of p.specifications || []) {
                const first = (g.options || []).find((o) => o.status !== 'inactive');
                if (first)
                    initial[g.id] = first.id;
            }
            setSelected(initial);
            if (p.images?.length)
                setActiveImage(0);
            // Track view
            trackEvent('product_viewed', { product_id: p.id, slug: p.slug });
            // Load reviews & recommendations
            fetchProductReviews(p.id)
                .then((rRes) => setReviews(rRes.data || []))
                .catch(() => { });
            fetchProductRecommendations(p.id)
                .then((recRes) => setRecommendations(recRes.data || []))
                .catch(() => { });
        })
            .catch((err) => setError(err.message || 'Product not found'))
            .finally(() => setLoading(false));
    }, [idOrSlug]);
    const allRequiredSelected = useMemo(() => {
        if (!product?.specifications?.length)
            return true;
        return product.specifications.every((g) => {
            if (g.is_required === false)
                return true;
            return selected[g.id] != null;
        });
    }, [product, selected]);
    const optionIds = useMemo(() => Object.values(selected).filter(Boolean), [selected]);
    const runResolve = useCallback(async () => {
        if (!product || !allRequiredSelected || optionIds.length === 0) {
            setResolved(null);
            setResolveError(null);
            return;
        }
        setResolving(true);
        setResolveError(null);
        try {
            const res = await resolveVariant(product.id, optionIds);
            setResolved(res.data);
            trackEvent('product_variant_selected', { product_id: product.id, variant_id: res.data.id });
        }
        catch (err) {
            setResolved(null);
            if (err instanceof ApiError && err.status === 404) {
                setResolveError('This combination is currently not available');
            }
            else {
                setResolveError(err instanceof Error ? err.message : 'Unable to resolve combination');
            }
        }
        finally {
            setResolving(false);
        }
    }, [product, allRequiredSelected, optionIds]);
    useEffect(() => {
        runResolve();
    }, [runResolve]);
    function selectOption(group, option) {
        setSelected((prev) => ({ ...prev, [group.id]: option.id }));
    }
    async function handleAddToCart() {
        if (!resolved || !product)
            return;
        try {
            await addToCart(resolved.id, 1);
            trackEvent('product_added_to_cart', { product_id: product.id, variant_id: resolved.id });
            setAddedHint(true);
            setTimeout(() => setAddedHint(false), 2500);
        }
        catch (err) {
            setResolveError(err instanceof Error ? err.message : 'Could not add to cart');
        }
    }
    async function handleAddToWishlist() {
        if (!product)
            return;
        try {
            await addToWishlist(product.id, resolved?.id);
            trackEvent('product_saved', { product_id: product.id, variant_id: resolved?.id });
            setWishHint(true);
            setTimeout(() => setWishHint(false), 2500);
        }
        catch (err) {
            setResolveError(err instanceof Error ? err.message : 'Could not add to wishlist');
        }
    }
    async function handleReviewSubmit(e) {
        e.preventDefault();
        if (!product)
            return;
        setReviewSubmitting(true);
        setReviewMessage(null);
        try {
            await submitProductReview({
                product_id: product.id,
                rating: reviewRating,
                title: reviewTitle.trim() || undefined,
                comment: reviewComment.trim() || undefined,
            });
            setReviewMessage('Thank you! Your review has been submitted for moderation.');
            setReviewTitle('');
            setReviewComment('');
            setShowReviewModal(false);
        }
        catch (err) {
            setReviewMessage(err instanceof Error ? err.message : 'Failed to submit review.');
        }
        finally {
            setReviewSubmitting(false);
        }
    }
    const price = resolved ? Number(resolved.price) : null;
    const compare = resolved?.compare_at_price != null ? Number(resolved.compare_at_price) : null;
    const available = resolved?.inventory?.available;
    const inStock = available == null || available > 0;
    const images = product?.images || [];
    return (<Layout>
      <Seo
        title={product ? `${product.name} — Bespoke Tailored Shirt` : 'Product Details'}
        description={product?.seo_description || product?.short_description || 'Handcrafted bespoke shirt from NP Clothings.'}
        canonical={product ? `https://npclothings.com/product/${product.slug || product.id}` : undefined}
        image={product?.images?.[0]?.url}
        jsonLd={productJsonLd}
      />
      <div className="mx-auto max-w-6xl w-full px-6 py-10">
        {loading && (<p className="text-center py-24 text-xs tracking-widest uppercase text-neutral-400">
            Crafting product view…
          </p>)}
        {error && (<div className="text-center py-24">
            <p className="text-sm text-neutral-600 mb-4">{error}</p>
            <Link to="/shop" className="text-xs tracking-widest uppercase underline">
              Back to Collection
            </Link>
          </div>)}

        {product && !loading && (<div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
              {/* Gallery */}
              <div>
                <div className="aspect-[3/4] bg-neutral-200 overflow-hidden mb-3 relative group">
                  {images[activeImage]?.url ? (
                    <>
                      <img
                        src={images[activeImage].url}
                        alt={images[activeImage].alt_text || product.name}
                        className="w-full h-full object-cover transition duration-300"
                      />
                      {images[activeImage]?.alt_text && (() => {
                        const TagIcon = getSampleTagIcon(images[activeImage].alt_text);
                        return (
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg shadow-sm border border-neutral-200/80 text-[11px] font-medium tracking-wide uppercase text-neutral-900 flex items-center gap-1.5">
                            <TagIcon className="w-3.5 h-3.5 text-[#c9a96e]" />
                            <span>{images[activeImage].alt_text}</span>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 tracking-[0.3em] text-xs">
                      NP CLOTHINGS
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="space-y-2">
                    {/* Sample Category Quick Filter Pills */}
                    {images.some((img) => img.alt_text && !img.alt_text.toLowerCase().includes('general')) && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
                        {['All Photos', 'Collar', 'Button', 'Placket', 'Cuff'].map((tag) => {
                          const isAll = tag === 'All Photos';
                          const hasTag = isAll || images.some((img) => (img.alt_text || '').toLowerCase().includes(tag.toLowerCase()));
                          if (!hasTag) return null;
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                if (isAll) {
                                  setActiveImage(0);
                                } else {
                                  const found = images.findIndex((img) =>
                                    (img.alt_text || '').toLowerCase().includes(tag.toLowerCase())
                                  );
                                  if (found !== -1) setActiveImage(found);
                                }
                              }}
                              className="px-2.5 py-0.5 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 text-[10px] tracking-wide uppercase transition cursor-pointer shrink-0"
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Thumbnail Strip */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((img, i) => (
                        <button
                          key={img.id || i}
                          type="button"
                          onClick={() => setActiveImage(i)}
                          className={`relative w-16 h-20 shrink-0 bg-neutral-200 overflow-hidden border transition ${
                            i === activeImage
                              ? 'border-neutral-900 ring-2 ring-neutral-900'
                              : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          {img.alt_text && (
                            <span className="absolute bottom-0 inset-x-0 bg-black/75 backdrop-blur-2xs text-[8px] text-white text-center py-0.5 px-0.5 truncate uppercase tracking-tighter">
                              {img.alt_text}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Info + Clothing Customization Engine */}
              <div>
                <p className="text-xs tracking-widest uppercase text-neutral-400 mb-2">
                  {[product.brand_name, product.category_name].filter(Boolean).join(' · ')}
                </p>
                <h1 className="text-3xl font-light tracking-wide mb-3">{product.name}</h1>
                {product.short_description && (
                  <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                    {product.short_description}
                  </p>
                )}

                {/* Real-time Dynamic Pricing from Backend */}
                <div className="mb-8 min-h-[2rem]">
                  {resolving && (<p className="text-sm text-neutral-400">Recalculating tailored price…</p>)}
                  {!resolving && price != null && (
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-light text-neutral-900">₹{price.toLocaleString('en-IN')}</span>
                      {compare != null && compare > price && (
                        <span className="text-sm text-neutral-400 line-through">
                          ₹{compare.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  )}
                  {!resolving && resolveError && (<p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">{resolveError}</p>)}
                  {!resolving && resolved && available != null && (
                    <p className="text-xs text-neutral-500 mt-1">
                      {available > 0
                        ? available <= 5
                          ? `Only ${available} pieces remaining in stock`
                          : 'In stock — ready to tailor & dispatch'
                        : 'Currently Out of stock'}
                    </p>
                  )}
                  {resolved?.sku && (<p className="text-[11px] text-neutral-400 mt-1 tracking-wider uppercase">SKU: {resolved.sku}</p>)}
                  {resolved && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-neutral-100">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Selected:</span>
                      {(product.specifications || []).map((g) => {
                        const opt = g.options?.find((o) => o.id === selected[g.id]);
                        if (!opt) return null;
                        return (
                          <span key={g.id} className="text-[11px] bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-md border border-neutral-200">
                            {g.name}: <strong className="font-semibold text-neutral-900">{opt.name}</strong>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Specification Customization Groups (Collar, Buttons, Placket, Cuff, Size, Color) */}
                <div className="space-y-6 mb-10">
                  {(product.specifications || []).map((group) => {
                    const matchingImgIdx = images.findIndex((img) =>
                      img.alt_text && img.alt_text.toLowerCase().includes(group.name.toLowerCase().trim())
                    );

                    return (
                      <div key={group.id}>
                        <div className="flex justify-between items-center mb-2.5">
                          <div className="flex items-center gap-2">
                            <p className="text-xs tracking-widest uppercase text-neutral-500 font-medium">
                              {group.name}
                              {group.is_required !== false && (<span className="text-neutral-400 ml-1">*</span>)}
                            </p>
                            {matchingImgIdx !== -1 && (
                              <button
                                type="button"
                                onClick={() => setActiveImage(matchingImgIdx)}
                                className="text-[10px] text-amber-900 hover:text-black bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full transition flex items-center gap-1 cursor-pointer font-medium"
                              >
                                <Eye className="w-3 h-3 stroke-[1.8]" />
                                <span>View Sample</span>
                              </button>
                            )}
                          </div>
                          {selected[group.id] && (
                            <span className="text-xs text-neutral-400">
                              {group.options.find((o) => o.id === selected[group.id])?.name}
                            </span>
                          )}
                        </div>

                      <div className="flex flex-wrap gap-2">
                        {(group.options || [])
                    .filter((o) => o.status !== 'inactive')
                    .map((opt) => {
                    const isSelected = selected[group.id] === opt.id;
                    const meta = parseMeta(opt.metadata);
                    const isSwatch = group.input_type === 'swatch' || group.code === 'color';
                    if (isSwatch && meta.hex) {
                        return (<button key={opt.id} type="button" title={opt.name} onClick={() => selectOption(group, opt)} className={`w-9 h-9 rounded-full border-2 transition ${isSelected ? 'border-neutral-900 scale-110 shadow-sm' : 'border-neutral-200 hover:border-neutral-400'}`} style={{ backgroundColor: meta.hex }}/>);
                    }
                    return (<button key={opt.id} type="button" onClick={() => selectOption(group, opt)} className={`px-4 py-2 text-xs tracking-wider uppercase border transition ${isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white font-medium'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900'}`}>
                                {opt.name}
                              </button>);
                })}
                      </div>
                    </div>
                  );
                })}
              </div>

                {/* Actions: Add to Cart & Wishlist */}
                <div className="flex flex-wrap gap-3 items-center">
                  <button type="button" disabled={!resolved || !inStock || resolving} onClick={handleAddToCart} className="flex-1 md:flex-initial min-w-[200px] text-xs tracking-widest uppercase py-4 px-10 bg-neutral-900 text-white disabled:opacity-40 hover:bg-neutral-800 transition flex items-center justify-center gap-2">
                    {!resolved ? (
                      <span>{resolveError || 'Select options'}</span>
                    ) : !inStock ? (
                      <span>Out of stock</span>
                    ) : addedHint ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Added to cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to cart</span>
                      </>
                    )}
                  </button>
                  <button type="button" onClick={handleAddToWishlist} className="text-xs tracking-widest uppercase py-4 px-6 border border-neutral-300 hover:border-neutral-900 transition text-neutral-800 bg-white flex items-center gap-2">
                    {wishHint ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Saved to Wishlist</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4" />
                        <span>Save to Wishlist</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400 mt-3 tracking-wide">
                  Calculated based on combination pricing from backend engine.
                </p>

                {/* Details Section */}
                {product.description && (<div className="mt-12 pt-8 border-t border-neutral-200">
                    <p className="text-xs tracking-widest uppercase text-neutral-400 mb-3">Garment Details</p>
                    <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                    {(product.design_pattern || product.base_material) && (<ul className="mt-4 text-xs text-neutral-500 space-y-1">
                        {product.design_pattern && <li>Fabric Pattern: {product.design_pattern}</li>}
                        {product.base_material && <li>Composition: {product.base_material}</li>}
                      </ul>)}
                  </div>)}
              </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="mt-20 pt-12 border-t border-neutral-200 reveal-on-scroll">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-light tracking-wide">Client Impressions & Reviews</h2>
                  <p className="text-xs text-neutral-400 mt-1">Verified reviews for tailored finishes</p>
                </div>
                <button type="button" onClick={() => setShowReviewModal(!showReviewModal)} className="text-xs tracking-widest uppercase border border-neutral-900 px-5 py-2.5 hover:bg-neutral-900 hover:text-white transition duration-300">
                  Write a Review
                </button>
              </div>

              {reviewMessage && (<div className="mb-6 p-3 bg-neutral-100 text-xs text-neutral-800 rounded">
                  {reviewMessage}
                </div>)}

              {showReviewModal && (<form onSubmit={handleReviewSubmit} className="mb-10 p-6 bg-white border border-neutral-200 rounded-xl space-y-4 max-w-xl animate-fade-in">
                  <h3 className="text-xs tracking-widest uppercase text-neutral-500 font-medium">Submit Your Review</h3>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Rating</label>
                    <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="border border-neutral-300 rounded px-3 py-1.5 text-xs bg-white">
                      <option value={5}>5 / 5 - Exceptional</option>
                      <option value={4}>4 / 5 - Very Good</option>
                      <option value={3}>3 / 5 - Good</option>
                      <option value={2}>2 / 5 - Fair</option>
                      <option value={1}>1 / 5 - Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Headline</label>
                    <input type="text" required value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} placeholder="E.g., Perfect drape and collar construction" className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"/>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Comments</label>
                    <textarea rows={3} required value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share your thoughts on the fabric feel, fit, and craftsmanship..." className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"/>
                  </div>
                  <button type="submit" disabled={reviewSubmitting} className="bg-neutral-900 text-white text-xs tracking-wider uppercase py-2.5 px-6 rounded hover:bg-neutral-800 disabled:opacity-50 transition">
                    {reviewSubmitting ? 'Submitting…' : 'Post Review'}
                  </button>
                </form>)}

              {reviews.length === 0 ? (<p className="text-xs text-neutral-400 py-6">Be the first to leave an impression on this bespoke creation.</p>) : (<div className="grid md:grid-cols-2 gap-6">
                  {reviews.map((rev, idx) => (<div key={rev.id} className={`p-5 bg-white border border-neutral-200 rounded-xl space-y-2 reveal-on-scroll delay-${((idx % 2) + 1) * 100} luxury-card-hover`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-neutral-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                      {rev.title && <p className="text-sm font-medium text-neutral-900">{rev.title}</p>}
                      <p className="text-xs text-neutral-600 leading-relaxed">{rev.comment}</p>
                      <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-2">— {rev.user_name || 'Verified Client'}</p>
                    </div>))}
                </div>)}
            </div>

            {/* Recommendations / Related Pieces */}
            {recommendations.length > 0 && (<div className="mt-20 pt-12 border-t border-neutral-200 reveal-on-scroll">
                <h2 className="text-xl font-light tracking-wide mb-8">Complementary Creations</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {recommendations.slice(0, 4).map((rec, i) => (<Link key={i} to={`/product/${rec.slug || rec.id}`} className={`group reveal-on-scroll delay-${(i + 1) * 100} luxury-card-hover p-2 rounded-sm`}>
                      <div className="aspect-[3/4] bg-neutral-200 overflow-hidden mb-3 rounded-sm">
                        {rec.image_url ? (<img src={String(rec.image_url)} alt={String(rec.name)} className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out"/>) : (<div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                            NP CLOTHINGS
                          </div>)}
                      </div>
                      <p className="text-sm font-light text-neutral-900 group-hover:text-[#c9a96e] transition-colors">{rec.name}</p>
                      {rec.min_price != null && (<p className="text-xs text-neutral-500 mt-1">From ₹{Number(rec.min_price).toLocaleString('en-IN')}</p>)}
                    </Link>))}
                </div>
              </div>)}
          </div>)}
      </div>
    </Layout>);
}
