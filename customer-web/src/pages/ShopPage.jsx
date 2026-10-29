import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { fetchStorefrontProducts, fetchFacets, fetchCategoryTree } from '../services/api';
import BranchedMenu from '../components/BranchedMenu';
import {
  Shirt,
  Sparkles,
  Layers,
  Scissors,
  Baby,
  Tag,
  Search,
  Filter,
  X,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

function getCategoryIcon(name = '', slug = '') {
  const s = (name + ' ' + slug).toLowerCase();
  if (s.includes('t-shirt') || s.includes('tshirt') || s.includes('shirt')) return Shirt;
  if (
    s.includes('dress') ||
    s.includes('frock') ||
    s.includes('lehenga') ||
    s.includes('chudi') ||
    s.includes('saree') ||
    s.includes('kurti')
  ) {
    return Layers;
  }
  if (
    s.includes('suit') ||
    s.includes('kurta') ||
    s.includes('trouser') ||
    s.includes('pant') ||
    s.includes('shorts')
  ) {
    return Scissors;
  }
  if (s.includes('boy') || s.includes('girl') || s.includes('kid')) return Baby;
  if (s.includes('all')) return Sparkles;
  return Tag;
}

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const q = params.get('q') || '';
  const categoryId = params.get('category_id') || '';
  const brandId = params.get('brand_id') || '';
  const sort = params.get('sort') || 'newest';
  const page = params.get('page') || '1';

  useEffect(() => {
    Promise.all([fetchFacets(), fetchCategoryTree()])
      .then(([facetRes, treeRes]) => {
        setCategories(facetRes.data?.categories || []);
        setBrands(facetRes.data?.brands || []);
        setCategoryTree(treeRes.data || []);
      })
      .catch(() => {});
  }, []);

  const branchedMenuItems = useMemo(() => {
    if (!categoryTree || categoryTree.length === 0) {
      return [
        { label: 'All Creations', value: '', icon: Sparkles },
        ...categories.map((c) => ({
          value: String(c.id),
          label: c.name,
          icon: getCategoryIcon(c.name, c.slug),
        })),
      ];
    }

    const items = [
      {
        label: 'All Creations',
        value: '',
        icon: Sparkles,
      },
    ];

    for (const root of categoryTree) {
      const hasGrandchildren = root.children?.some((c) => c.children?.length > 0);
      if (hasGrandchildren) {
        for (const sub of root.children || []) {
          if (sub.children?.length > 0) {
            items.push({
              label: `${root.name} · ${sub.name}`,
              children: [
                {
                  value: String(sub.id),
                  label: `All ${sub.name}`,
                  icon: getCategoryIcon(sub.name, sub.slug),
                },
                ...sub.children.map((leaf) => ({
                  value: String(leaf.id),
                  label: leaf.name,
                  icon: getCategoryIcon(leaf.name, leaf.slug),
                })),
              ],
            });
          } else {
            items.push({
              value: String(sub.id),
              label: `${root.name} · ${sub.name}`,
              icon: getCategoryIcon(sub.name, sub.slug),
            });
          }
        }
      } else if (root.children?.length > 0) {
        items.push({
          label: root.name,
          children: [
            {
              value: String(root.id),
              label: `All ${root.name}`,
              icon: getCategoryIcon(root.name, root.slug),
            },
            ...root.children.map((c) => ({
              value: String(c.id),
              label: c.name,
              icon: getCategoryIcon(c.name, c.slug),
            })),
          ],
        });
      } else {
        items.push({
          value: String(root.id),
          label: root.name,
          icon: getCategoryIcon(root.name, root.slug),
        });
      }
    }

    return items;
  }, [categoryTree, categories]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchStorefrontProducts({
      q: q || undefined,
      category_id: categoryId || undefined,
      brand_id: brandId || undefined,
      sort,
      page: Number(page),
      limit: 12,
    })
      .then((res) => {
        setProducts(res.data || []);
        setMeta(res.meta || {});
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [q, categoryId, brandId, sort, page]);

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
  }

  function clearAllFilters() {
    setParams(new URLSearchParams());
  }

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
        name: 'Collections',
        item: 'https://npclothings.com/shop',
      },
    ],
  };

  const hasActiveFilters = Boolean(q || categoryId || brandId || (sort && sort !== 'newest'));

  return (
    <Layout>
      <Seo
        title="Atelier Collections — Bespoke Shirts & Trousers"
        description="Browse handcrafted quiet luxury menswear, signature Chinese & mandarin collar shirts, European flax linens, and tailored trousers."
        canonical="https://npclothings.com/shop"
        jsonLd={breadcrumbJsonLd}
      />

      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link to="/" className="hover:text-stone-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="text-stone-900 font-medium" aria-current="page">
            Collections
          </span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 mb-8 border-b border-stone-200/80 gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] font-semibold block mb-1">
              Atelier Archive
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 font-light tracking-wide">
              Wardrobe Collections
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-light mt-1.5">
              Handcrafted in limited editions with made-to-measure personalization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-800"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#c9a96e]" />
              <span>Filters {hasActiveFilters && '•'}</span>
            </button>

            <span className="text-xs text-stone-400 font-light hidden sm:inline">
              {meta.total != null ? `${meta.total} pieces crafted` : ''}
            </span>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Sidebar Filters */}
          <aside
            className={`w-full md:w-64 shrink-0 space-y-7 ${
              mobileFilterOpen ? 'block' : 'hidden md:block'
            }`}
          >
            {/* Search Input */}
            <div className="bg-white p-4 rounded-xl border border-stone-200">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-stone-500 block mb-2">
                Search Creations
              </label>
              <div className="relative">
                <input
                  type="search"
                  defaultValue={q}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateParam('q', e.target.value);
                    }
                  }}
                  placeholder="E.g., linen, chinese collar…"
                  className="w-full border border-stone-300 rounded-lg bg-stone-50/50 pl-8 pr-3 py-2 text-xs text-stone-900 outline-none focus:border-[#c9a96e] focus:bg-white transition-all"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Category Tree Navigation */}
            <div className="bg-white p-4 rounded-xl border border-stone-200">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-stone-500 mb-3">
                Categories
              </p>
              <div className="w-full overflow-hidden">
                <BranchedMenu
                  items={branchedMenuItems}
                  active={categoryId}
                  defaultOpen={-1}
                  onSelect={(val) => updateParam('category_id', val)}
                  color="#292524"
                  accentColor="#1c1917"
                  lineColor="#e7e5e4"
                  width={230}
                  rowHeight={32}
                  indent={28}
                  trunk={10}
                  radius={8}
                  fontSize={13}
                />
              </div>
            </div>

            {/* Brand Filter */}
            {brands.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-stone-200">
                <p className="text-[11px] font-semibold tracking-wider uppercase text-stone-500 mb-2.5">
                  Brand & Line
                </p>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => updateParam('brand_id', '')}
                    className={`block w-full text-left text-xs py-1 px-2 rounded-md transition-colors ${
                      !brandId
                        ? 'font-semibold text-stone-900 bg-stone-100'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    All Lines
                  </button>
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => updateParam('brand_id', String(b.id))}
                      className={`block w-full text-left text-xs py-1 px-2 rounded-md transition-colors ${
                        brandId === String(b.id)
                          ? 'font-semibold text-stone-900 bg-stone-100'
                          : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort Options */}
            <div className="bg-white p-4 rounded-xl border border-stone-200">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-stone-500 block mb-2">
                Sort By
              </label>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="w-full border border-stone-300 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-900 outline-none focus:border-[#c9a96e]"
              >
                <option value="newest">Newest Releases</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="w-full py-2 px-3 border border-stone-300 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1">
            {/* Quick Active Filter Pill Summary */}
            {hasActiveFilters && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-xs text-stone-500 font-medium">Active:</span>
                {q && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-stone-200 text-stone-800">
                    Search: "{q}"
                    <button
                      type="button"
                      onClick={() => updateParam('q', '')}
                      className="hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {categoryId && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-stone-200 text-stone-800">
                    Category Selected
                    <button
                      type="button"
                      onClick={() => updateParam('category_id', '')}
                      className="hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {brandId && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-stone-200 text-stone-800">
                    Brand Filter
                    <button
                      type="button"
                      onClick={() => updateParam('brand_id', '')}
                      className="hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-[#c9a96e] hover:underline font-medium ml-1"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="aspect-[3/4] bg-stone-200 rounded-xl"></div>
                    <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                    <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <p className="font-medium">Unable to load catalog</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && products.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p, idx) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.slug || p.id}`}
                    className={`group block p-3 rounded-2xl bg-white border border-stone-200/90 hover:border-stone-400 hover:shadow-xl luxury-card-hover transition-all reveal-on-scroll delay-${
                      ((idx % 3) + 1) * 100
                    }`}
                  >
                    <div className="aspect-[3/4] bg-stone-100 mb-3.5 overflow-hidden rounded-xl relative border border-stone-100">
                      {p.primary_image?.url ? (
                        <img
                          src={p.primary_image.url}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs tracking-widest uppercase p-4 text-center">
                          <Shirt className="w-8 h-8 mb-2 stroke-[1.2] text-stone-300" />
                          <span>NP Clothings</span>
                        </div>
                      )}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-stone-900/80 backdrop-blur-xs text-white text-[9px] uppercase tracking-widest rounded font-medium">
                        Bespoke
                      </span>
                    </div>

                    <h3 className="text-sm font-medium tracking-wide text-stone-900 group-hover:text-[#a37d32] transition-colors truncate">
                      {p.name}
                    </h3>

                    <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                      {[p.category_name, p.brand_name].filter(Boolean).join(' · ') || 'Bespoke Shirt'}
                    </p>

                    {p.min_price != null && (
                      <p className="text-sm font-semibold text-stone-900 mt-1.5">
                        ₹{Number(p.min_price).toLocaleString('en-IN')}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && !error && (
              <div className="text-center py-20 bg-white border border-stone-200 rounded-2xl p-8">
                <Shirt className="w-10 h-10 text-stone-300 mx-auto mb-3 stroke-[1.2]" />
                <h3 className="text-base font-serif text-stone-900 font-medium mb-1">
                  No matching bespoke pieces found
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
                  Try adjusting your search terms or reset the category filters to browse the full atelier collection.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-widest font-medium rounded-lg transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {(meta.totalPages || 1) > 1 && (
              <div className="flex gap-4 items-center justify-center mt-14 text-xs tracking-widest uppercase">
                <button
                  type="button"
                  disabled={Number(page) <= 1}
                  onClick={() => updateParam('page', String(Number(page) - 1))}
                  className="px-4 py-2 border border-stone-300 rounded-lg disabled:opacity-30 hover:bg-white transition-colors cursor-pointer"
                >
                  Prev
                </button>
                <span className="text-stone-500">
                  Page {page} of {meta.totalPages}
                </span>
                <button
                  type="button"
                  disabled={Number(page) >= (meta.totalPages || 1)}
                  onClick={() => updateParam('page', String(Number(page) + 1))}
                  className="px-4 py-2 border border-stone-300 rounded-lg disabled:opacity-30 hover:bg-white transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
