import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { fetchStorefrontProducts, fetchFacets, fetchCategoryTree } from '../services/api';
import BranchedMenu from '../components/BranchedMenu';
import {
  Shirt,
  Sparkles,
  Layers,
  Scissors,
  Baby,
  Tag,
  ShoppingBag,
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
    useEffect(() => {
        document.title = 'Shop | NP Clothings';
    }, []);
    const [params, setParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [meta, setMeta] = useState({});
    const [categories, setCategories] = useState([]);
    const [categoryTree, setCategoryTree] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
            .catch(() => { });
    }, []);

    const branchedMenuItems = useMemo(() => {
        if (!categoryTree || categoryTree.length === 0) {
            return [
                { label: 'All Products', value: '', icon: Sparkles },
                ...categories.map((c) => ({
                    value: String(c.id),
                    label: c.name,
                    icon: getCategoryIcon(c.name, c.slug),
                })),
            ];
        }

        const items = [
            {
                label: 'All Products',
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
                                ...sub.children.map((kid) => ({
                                    value: String(kid.id),
                                    label: kid.name,
                                    icon: getCategoryIcon(kid.name, kid.slug),
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
            } else if (root.children && root.children.length > 0) {
                items.push({
                    label: root.name,
                    children: [
                        {
                            value: String(root.id),
                            label: `All ${root.name}`,
                            icon: getCategoryIcon(root.name, root.slug),
                        },
                        ...root.children.map((child) => ({
                            value: String(child.id),
                            label: child.name,
                            icon: getCategoryIcon(child.name, child.slug),
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
            page,
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
        if (!value)
            next.delete(key);
        else
            next.set(key, value);
        if (key !== 'page')
            next.delete('page');
        setParams(next);
    }
    return (<Layout>
      <div className="mx-auto max-w-6xl w-full px-6 py-10">
        <div className="flex flex-col md:flex-row gap-10">
          <aside className="w-full md:w-56 shrink-0 space-y-8">
            <div>
              <label className="text-xs tracking-widest uppercase text-neutral-400 block mb-2">
                Search
              </label>
              <input type="search" defaultValue={q} onKeyDown={(e) => {
            if (e.key === 'Enter') {
                updateParam('q', e.target.value);
            }
        }} placeholder="Search…" className="w-full border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"/>
            </div>
            <div>
              <p className="text-xs tracking-widest uppercase text-neutral-400 mb-3">Category</p>
              <div className="w-full overflow-hidden">
                <BranchedMenu
                  items={branchedMenuItems}
                  active={categoryId}
                  defaultOpen={-1}
                  onSelect={(val) => updateParam('category_id', val)}
                  color="#292524"
                  accentColor="#1c1917"
                  lineColor="#e7e5e4"
                  width={224}
                  rowHeight={32}
                  indent={32}
                  trunk={10}
                  radius={8}
                  fontSize={13}
                />
              </div>
            </div>
            <div>
              <p className="text-xs tracking-widest uppercase text-neutral-400 mb-3">Brand</p>
              <button type="button" onClick={() => updateParam('brand_id', '')} className={`block text-sm mb-1 ${!brandId ? 'text-neutral-900' : 'text-neutral-500'}`}>
                All
              </button>
              {brands.map((b) => (<button key={b.id} type="button" onClick={() => updateParam('brand_id', String(b.id))} className={`block text-sm mb-1 text-left ${brandId === String(b.id) ? 'text-neutral-900' : 'text-neutral-500'}`}>
                  {b.name}
                </button>))}
            </div>
            <div>
              <p className="text-xs tracking-widest uppercase text-neutral-400 mb-3">Sort</p>
              <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="w-full border border-neutral-200 bg-white px-2 py-2 text-sm">
                <option value="newest">Newest</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
                <option value="name">Name</option>
              </select>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-baseline justify-between mb-8">
              <h1 className="text-2xl font-light tracking-wide">Shop</h1>
              <p className="text-xs text-neutral-400">
                {meta.total != null ? `${meta.total} pieces` : ''}
              </p>
            </div>

            {loading && (<p className="text-sm text-neutral-400 tracking-widest uppercase">Loading…</p>)}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p, idx) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.slug || p.id}`}
                    className={`group block reveal-on-scroll delay-${((idx % 3) + 1) * 100} luxury-card-hover p-2 rounded-sm transition-all`}
                  >
                    <div className="aspect-[3/4] bg-neutral-200 mb-3 overflow-hidden rounded-sm">
                      {p.primary_image?.url ? (
                        <img
                          src={p.primary_image.url}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs tracking-widest">
                          NP CLOTHINGS
                        </div>
                      )}
                    </div>
                    <p className="text-sm tracking-wide text-neutral-900 group-hover:text-[#c9a96e] transition-colors">{p.name}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {[p.brand_name, p.category_name].filter(Boolean).join(' · ')}
                    </p>
                    {p.min_price != null && (
                      <p className="text-sm font-medium mt-1 text-neutral-900">₹{Number(p.min_price).toLocaleString('en-IN')}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {!loading && products.length === 0 && !error && (<p className="text-sm text-neutral-500">No products match these filters.</p>)}

            {(meta.totalPages || 1) > 1 && (<div className="flex gap-4 justify-center mt-12 text-xs tracking-widest uppercase">
                <button type="button" disabled={Number(page) <= 1} onClick={() => updateParam('page', String(Number(page) - 1))} className="disabled:opacity-30">
                  Prev
                </button>
                <span className="text-neutral-400">
                  {page} / {meta.totalPages}
                </span>
                <button type="button" disabled={Number(page) >= (meta.totalPages || 1)} onClick={() => updateParam('page', String(Number(page) + 1))} className="disabled:opacity-30">
                  Next
                </button>
              </div>)}
          </div>
        </div>
      </div>
    </Layout>);
}
