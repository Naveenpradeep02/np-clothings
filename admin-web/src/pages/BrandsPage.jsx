import { useState, useEffect } from 'react';
import {
    listBrands,
    createBrand,
    updateBrand,
    deleteBrand,
} from '../services/api';
import ImageUploader from '../components/ImageUploader';
import { Sparkles, Plus, X, Globe } from 'lucide-react';

export default function BrandsPage() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formSlug, setFormSlug] = useState('');
    const [formLogoUrl, setFormLogoUrl] = useState('');
    const [formWebsiteUrl, setFormWebsiteUrl] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formSortOrder, setFormSortOrder] = useState('0');
    const [formStatus, setFormStatus] = useState('active');

    async function loadBrands() {
        setLoading(true);
        try {
            const res = await listBrands({ limit: 100, search });
            setBrands(res.data || []);
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Failed to load brands' });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadBrands();
    }, [search]);

    function openCreateModal() {
        setEditingBrand(null);
        setFormName('');
        setFormSlug('');
        setFormLogoUrl('');
        setFormWebsiteUrl('');
        setFormDescription('');
        setFormSortOrder('0');
        setFormStatus('active');
        setModalOpen(true);
    }

    function openEditModal(brand) {
        setEditingBrand(brand);
        setFormName(brand.name);
        setFormSlug(brand.slug);
        setFormLogoUrl(brand.logo_url || '');
        setFormWebsiteUrl(brand.website_url || '');
        setFormDescription(brand.description || '');
        setFormSortOrder(String(brand.sort_order || 0));
        setFormStatus(brand.status || 'active');
        setModalOpen(true);
    }

    function handleNameChange(val) {
        setFormName(val);
        if (!editingBrand) {
            const slugPart = val
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_]+/g, '-');
            setFormSlug(slugPart);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setFeedback(null);
        try {
            const payload = {
                name: formName.trim(),
                slug: formSlug.trim(),
                logo_url: formLogoUrl.trim() || null,
                website_url: formWebsiteUrl.trim() || null,
                description: formDescription.trim() || null,
                sort_order: Number(formSortOrder) || 0,
                status: formStatus,
            };

            if (editingBrand) {
                await updateBrand(editingBrand.id, payload);
                setFeedback({ type: 'success', message: `Brand "${payload.name}" updated successfully` });
            } else {
                await createBrand(payload);
                setFeedback({ type: 'success', message: `Brand "${payload.name}" created successfully` });
            }
            setModalOpen(false);
            await loadBrands();
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Operation failed' });
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(brand) {
        if (!window.confirm(`Are you sure you want to delete brand "${brand.name}"?`)) {
            return;
        }
        setBusy(true);
        try {
            await deleteBrand(brand.id);
            setFeedback({ type: 'success', message: `Brand "${brand.name}" deleted` });
            await loadBrands();
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Failed to delete brand' });
        } finally {
            setBusy(false);
        }
    }

    // 1-Click Preset to populate popular apparel brands with images
    async function handlePopulatePresets() {
        if (!window.confirm('Populate top apparel brands with logos (Zara, Raymond, FabIndia, Allen Solly, Peter England, Levi\'s)?')) {
            return;
        }
        setBusy(true);
        setFeedback(null);
        try {
            const presets = [
                {
                    name: 'Zara',
                    slug: 'zara',
                    logo_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=200&auto=format&fit=crop&q=80',
                    website_url: 'https://zara.com',
                    description: 'Global contemporary fashion and tailoring',
                    sort_order: 1,
                },
                {
                    name: 'Raymond',
                    slug: 'raymond',
                    logo_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&auto=format&fit=crop&q=80',
                    website_url: 'https://raymond.in',
                    description: 'The Complete Man — finest worsted suiting and shirting',
                    sort_order: 2,
                },
                {
                    name: 'FabIndia',
                    slug: 'fabindia',
                    logo_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&auto=format&fit=crop&q=80',
                    website_url: 'https://fabindia.com',
                    description: 'Handcrafted traditional Indian apparel and linen',
                    sort_order: 3,
                },
                {
                    name: 'Allen Solly',
                    slug: 'allen-solly',
                    logo_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&auto=format&fit=crop&q=80',
                    website_url: 'https://allensolly.com',
                    description: 'Smart casuals and Friday dressing',
                    sort_order: 4,
                },
                {
                    name: 'Peter England',
                    slug: 'peter-england',
                    logo_url: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=200&auto=format&fit=crop&q=80',
                    website_url: 'https://peterengland.com',
                    description: 'Honest shirts and formal trousers',
                    sort_order: 5,
                },
                {
                    name: "Levi's",
                    slug: 'levis',
                    logo_url: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=200&auto=format&fit=crop&q=80',
                    website_url: 'https://levi.in',
                    description: 'Authentic denim and casual wear',
                    sort_order: 6,
                },
                {
                    name: 'Manyavar',
                    slug: 'manyavar',
                    logo_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&auto=format&fit=crop&q=80',
                    website_url: 'https://manyavar.com',
                    description: 'Celebration wear, sherwanis and kurtas',
                    sort_order: 7,
                },
            ];

            for (const p of presets) {
                if (!brands.some((b) => b.slug === p.slug || b.name === p.name)) {
                    await createBrand(p);
                }
            }

            setFeedback({ type: 'success', message: 'Top apparel brands populated successfully!' });
            await loadBrands();
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Failed to populate presets' });
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
                <div>
                    <h1 className="text-xl font-serif text-stone-900 tracking-tight">Brand Directory</h1>
                    <p className="text-xs text-stone-500 mt-1">
                        Manage clothing brands with Brand ID, Logo Images, and catalog associations
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={handlePopulatePresets}
                        className="px-3.5 py-2 text-xs font-medium text-[#8c6b2d] bg-[#fbf5ea] hover:bg-[#f6ebd5] border border-[#e8d8b9] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Auto-create Zara, Raymond, FabIndia, Allen Solly, Peter England, Levis, Manyavar with logos"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto-Populate Top Brands</span>
                    </button>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="px-4 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-black rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Brand</span>
                    </button>
                </div>
            </div>

            {feedback && (
                <div
                    className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between ${
                        feedback.type === 'error'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                >
                    <span>{feedback.message}</span>
                    <button type="button" onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-600">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Search & Counter */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-72">
                    <input
                        type="text"
                        placeholder="Search brands by name or ID…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 shadow-2xs"
                    />
                </div>
                <span className="text-xs font-medium text-stone-500">
                    Total Brands: <strong className="text-stone-900">{brands.length}</strong>
                </span>
            </div>

            {/* Brands Grid */}
            {loading ? (
                <div className="p-12 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
                    Loading brand directory…
                </div>
            ) : brands.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
                    <p className="text-sm font-medium text-stone-700">No brands found</p>
                    <p className="text-xs text-stone-400 mt-1">
                        Click "Auto-Populate Top Brands" or "Create Brand" to add brands with image logos.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brands.map((brand) => (
                        <div
                            key={brand.id}
                            className="bg-white border border-stone-200/90 rounded-2xl p-5 hover:border-stone-400 transition-all shadow-xs flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        {brand.logo_url ? (
                                            <img
                                                src={brand.logo_url}
                                                alt={brand.name}
                                                className="w-12 h-12 rounded-xl object-cover border border-stone-200 bg-stone-50 shadow-2xs"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/100x100?text=' + brand.name.slice(0, 2);
                                                }}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center font-serif text-sm font-semibold text-stone-700">
                                                {brand.name.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-semibold text-stone-900 text-sm">{brand.name}</h3>
                                            <p className="text-[11px] font-mono text-[#c9a96e]">
                                                ID: <span className="text-stone-500">{brand.slug}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                            brand.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-stone-100 text-stone-500'
                                        }`}
                                    >
                                        {brand.status}
                                    </span>
                                </div>

                                {brand.description && (
                                    <p className="text-xs text-stone-500 mb-3 line-clamp-2 leading-relaxed">
                                        {brand.description}
                                    </p>
                                )}

                                {brand.website_url && (
                                    <p className="text-[11px] text-stone-400 truncate mb-3 flex items-center gap-1">
                                        <Globe className="w-3 h-3 text-stone-400" />
                                        <a href={brand.website_url} target="_blank" rel="noreferrer" className="text-stone-600 hover:text-stone-900 hover:underline">
                                            {brand.website_url.replace(/^https?:\/\//, '')}
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs mt-2">
                                <span className="text-[10px] text-stone-400">Order: #{brand.sort_order || 0}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openEditModal(brand)}
                                        className="px-2.5 py-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(brand)}
                                        className="px-2.5 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for Create / Edit Brand */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                            <h2 className="text-base font-serif text-stone-900">
                                {editingBrand ? `Edit Brand: ${editingBrand.name}` : 'New Brand'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                    Brand Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Zara, Raymond, AUREA"
                                    value={formName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                    Brand ID / Slug <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. zara, raymond"
                                    value={formSlug}
                                    onChange={(e) => setFormSlug(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                />
                                <span className="text-[10px] text-stone-400 mt-0.5 block">Unique system brand identifier</span>
                            </div>

                            <ImageUploader
                                label="Brand Logo Image"
                                value={formLogoUrl}
                                onChange={setFormLogoUrl}
                                folder="brands"
                                placeholder="https://... logo image url"
                            />

                            <div>
                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                    Website URL (optional)
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://brand.com"
                                    value={formWebsiteUrl}
                                    onChange={(e) => setFormWebsiteUrl(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                    Description (optional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Heritage, fabrics, style specialties…"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-stone-700 mb-1">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        value={formSortOrder}
                                        onChange={(e) => setFormSortOrder(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={formStatus}
                                        onChange={(e) => setFormStatus(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy}
                                    className="px-5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-black rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {busy ? 'Saving…' : editingBrand ? 'Save Changes' : 'Save Brand'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

