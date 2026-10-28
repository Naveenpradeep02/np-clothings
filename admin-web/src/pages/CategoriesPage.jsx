import { useState, useEffect } from 'react';
import {
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategoryTree,
} from '../services/api';
import ImageUploader from '../components/ImageUploader';
import { Sparkles, Plus, X, FolderTree, ChevronDown, ChevronRight } from 'lucide-react';

export default function CategoriesPage() {
    const [tree, setTree] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('all'); // 'all' | 'men' | 'women' | 'kids'
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formParentId, setFormParentId] = useState('');
    const [formSlug, setFormSlug] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formImageUrl, setFormImageUrl] = useState('');
    const [formSortOrder, setFormSortOrder] = useState('0');
    const [formStatus, setFormStatus] = useState('active');

    async function loadData() {
        setLoading(true);
        try {
            const [treeRes, listRes] = await Promise.all([
                fetchCategoryTree(),
                listCategories({ limit: 100 }),
            ]);
            setTree(treeRes.data || []);
            setAllCategories(listRes.data || []);
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Failed to load categories' });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    function openCreateModal(parentId = '') {
        setEditingCategory(null);
        setFormName('');
        setFormParentId(parentId ? String(parentId) : '');
        setFormSlug('');
        setFormDescription('');
        setFormImageUrl('');
        setFormSortOrder('0');
        setFormStatus('active');
        setModalOpen(true);
    }

    function openEditModal(category) {
        setEditingCategory(category);
        setFormName(category.name);
        setFormParentId(category.parent_id ? String(category.parent_id) : '');
        setFormSlug(category.slug);
        setFormDescription(category.description || '');
        setFormImageUrl(category.image_url || '');
        setFormSortOrder(String(category.sort_order || 0));
        setFormStatus(category.status || 'active');
        setModalOpen(true);
    }

    function handleNameChange(val) {
        setFormName(val);
        if (!editingCategory) {
            const parent = allCategories.find((c) => String(c.id) === String(formParentId));
            const prefix = parent ? `${parent.slug}-` : '';
            const slugPart = val
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_]+/g, '-');
            setFormSlug(`${prefix}${slugPart}`);
        }
    }

    function handleParentChange(parentId) {
        setFormParentId(parentId);
        if (!editingCategory && formName) {
            const parent = allCategories.find((c) => String(c.id) === String(parentId));
            const prefix = parent ? `${parent.slug}-` : '';
            const slugPart = formName
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_]+/g, '-');
            setFormSlug(`${prefix}${slugPart}`);
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
                parent_id: formParentId ? Number(formParentId) : null,
                description: formDescription.trim() || null,
                image_url: formImageUrl.trim() || null,
                sort_order: Number(formSortOrder) || 0,
                status: formStatus,
            };

            if (editingCategory) {
                await updateCategory(editingCategory.id, payload);
                setFeedback({ type: 'success', message: `Category "${payload.name}" updated successfully` });
            } else {
                await createCategory(payload);
                setFeedback({ type: 'success', message: `Category "${payload.name}" created successfully` });
            }
            setModalOpen(false);
            await loadData();
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Operation failed' });
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(category) {
        if (!window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
            return;
        }
        setBusy(true);
        try {
            await deleteCategory(category.id);
            setFeedback({ type: 'success', message: `Category "${category.name}" deleted` });
            await loadData();
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Failed to delete category' });
        } finally {
            setBusy(false);
        }
    }

    // 1-Click Preset to populate requested clothing hierarchy
    async function handlePopulatePresets() {
        if (!window.confirm('Populate standard Men, Women, and Kids clothing hierarchy? (Existing categories will be kept)')) {
            return;
        }
        setBusy(true);
        setFeedback(null);
        try {
            // Find or create top level
            let men = allCategories.find((c) => c.slug === 'men');
            if (!men) {
                const res = await createCategory({ name: 'Men', slug: 'men', sort_order: 1 });
                men = res.data;
            }

            let women = allCategories.find((c) => c.slug === 'women');
            if (!women) {
                const res = await createCategory({ name: 'Women', slug: 'women', sort_order: 2 });
                women = res.data;
            }

            let kids = allCategories.find((c) => c.slug === 'kids');
            if (!kids) {
                const res = await createCategory({ name: 'Kids', slug: 'kids', sort_order: 3 });
                kids = res.data;
            }

            // Subcategories under Men
            const menSubs = [
                { name: 'Shirt', slug: 'men-shirt', image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80' },
                { name: 'T-Shirt', slug: 'men-tshirt', image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80' },
                { name: 'Pant', slug: 'men-pant', image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80' },
                { name: 'Half Trouser', slug: 'men-half-trouser', image_url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80' },
                { name: 'Kurta & Ethnic', slug: 'men-kurta', image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80' },
            ];

            for (let i = 0; i < menSubs.length; i++) {
                const sub = menSubs[i];
                if (!allCategories.some((c) => c.slug === sub.slug)) {
                    await createCategory({
                        name: sub.name,
                        slug: sub.slug,
                        parent_id: men.id,
                        image_url: sub.image_url,
                        sort_order: i + 1,
                    });
                }
            }

            // Subcategories under Women
            const womenSubs = [
                { name: 'Chudi / Chudidhar', slug: 'women-chudi', image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80' },
                { name: 'Lehenga', slug: 'women-lehenga', image_url: 'https://images.unsplash.com/photo-1583391733975-045391264c78?w=600&auto=format&fit=crop&q=80' },
                { name: 'Shirt', slug: 'women-shirt', image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80' },
                { name: 'Pant / Trousers', slug: 'women-pant', image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80' },
                { name: 'T-Shirt', slug: 'women-tshirt', image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80' },
                { name: 'Kurti', slug: 'women-kurti', image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80' },
            ];

            for (let i = 0; i < womenSubs.length; i++) {
                const sub = womenSubs[i];
                if (!allCategories.some((c) => c.slug === sub.slug)) {
                    await createCategory({
                        name: sub.name,
                        slug: sub.slug,
                        parent_id: women.id,
                        image_url: sub.image_url,
                        sort_order: i + 1,
                    });
                }
            }

            // Kids -> Boys and Girls
            let boys = allCategories.find((c) => c.slug === 'kids-boys');
            if (!boys) {
                const res = await createCategory({ name: 'Boys', slug: 'kids-boys', parent_id: kids.id, sort_order: 1 });
                boys = res.data;
            }

            let girls = allCategories.find((c) => c.slug === 'kids-girls');
            if (!girls) {
                const res = await createCategory({ name: 'Girls', slug: 'kids-girls', parent_id: kids.id, sort_order: 2 });
                girls = res.data;
            }

            // Subcategories under Boys
            const boySubs = [
                { name: 'Shirt', slug: 'kids-boys-shirt' },
                { name: 'T-Shirt', slug: 'kids-boys-tshirt' },
                { name: 'Pant', slug: 'kids-boys-pant' },
                { name: 'Shorts', slug: 'kids-boys-shorts' },
            ];
            for (let i = 0; i < boySubs.length; i++) {
                const sub = boySubs[i];
                if (!allCategories.some((c) => c.slug === sub.slug)) {
                    await createCategory({ name: sub.name, slug: sub.slug, parent_id: boys.id, sort_order: i + 1 });
                }
            }

            // Subcategories under Girls
            const girlSubs = [
                { name: 'Frock / Dress', slug: 'kids-girls-frock' },
                { name: 'Lehenga', slug: 'kids-girls-lehenga' },
                { name: 'T-Shirt', slug: 'kids-girls-tshirt' },
                { name: 'Pant', slug: 'kids-girls-pant' },
            ];
            for (let i = 0; i < girlSubs.length; i++) {
                const sub = girlSubs[i];
                if (!allCategories.some((c) => c.slug === sub.slug)) {
                    await createCategory({ name: sub.name, slug: sub.slug, parent_id: girls.id, sort_order: i + 1 });
                }
            }

            setFeedback({ type: 'success', message: 'All standard clothing categories successfully populated!' });
            await loadData();
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Preset population failed' });
        } finally {
            setBusy(false);
        }
    }

    // Filter tree according to selected tab
    const filteredTree = tree.filter((root) => {
        if (selectedTab === 'all') return true;
        return root.slug?.toLowerCase() === selectedTab.toLowerCase();
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
                <div>
                    <h1 className="text-xl font-serif text-stone-900 tracking-tight">Category Catalog</h1>
                    <p className="text-xs text-stone-500 mt-1">
                        Manage hierarchical clothing taxonomy (Men, Women, Kids & subcategories)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={handlePopulatePresets}
                        className="px-3.5 py-2 text-xs font-medium text-[#8c6b2d] bg-[#fbf5ea] hover:bg-[#f6ebd5] border border-[#e8d8b9] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Auto-create Men (Shirt, T-Shirt, Pant, Half Trouser), Women (Chudi, Lehenga, Shirt, Pant), and Kids"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto-Populate Clothing Presets</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => openCreateModal()}
                        className="px-4 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-black rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Category</span>
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

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs">
                {[
                    { id: 'all', label: 'All Categories' },
                    { id: 'men', label: 'Men' },
                    { id: 'women', label: 'Women' },
                    { id: 'kids', label: 'Kids' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedTab(tab.id)}
                        className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-medium ${
                            selectedTab === tab.id
                                ? 'bg-stone-900 text-white shadow-xs'
                                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Category Hierarchy Display */}
            {loading ? (
                <div className="p-12 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
                    Loading category structure…
                </div>
            ) : filteredTree.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
                    <p className="text-sm font-medium text-stone-700">No categories found</p>
                    <p className="text-xs text-stone-400 mt-1">Click "Auto-Populate Clothing Presets" or "Create Category" to begin.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTree.map((root) => (
                        <CategoryCard
                            key={root.id}
                            category={root}
                            level={0}
                            onAddChild={openCreateModal}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Modal for Create / Edit Category */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                            <h2 className="text-base font-serif text-stone-900">
                                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'New Clothing Category'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                    Parent Category (Hierarchy Level)
                                </label>
                                <select
                                    value={formParentId}
                                    onChange={(e) => handleParentChange(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 focus:bg-white focus:outline-none focus:border-stone-900"
                                >
                                    <option value="">None (Top-Level Main Category: e.g. Men, Women, Kids)</option>
                                    {allCategories
                                        .filter((c) => !editingCategory || c.id !== editingCategory.id)
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.parent_id ? `↳ ${c.name} (${c.slug})` : `• ${c.name} (Main)`}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-stone-700 mb-1">
                                        Category Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Shirt, Lehenga, Chudi"
                                        value={formName}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-700 mb-1">
                                        Slug (URL identifier) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. men-shirt, women-lehenga"
                                        value={formSlug}
                                        onChange={(e) => setFormSlug(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                    />
                                </div>
                            </div>

                            <ImageUploader
                                label="Category Banner / Icon Image"
                                value={formImageUrl}
                                onChange={setFormImageUrl}
                                folder="categories"
                                placeholder="https://images.unsplash.com/..."
                            />

                            <div>
                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                    Description (optional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Brief description of fabrics, styles, or cuts..."
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
                                        <option value="active">Active (Visible)</option>
                                        <option value="inactive">Inactive (Hidden)</option>
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
                                    {busy ? 'Saving…' : editingCategory ? 'Save Changes' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Tree Node Display
function CategoryCard({ category, level = 0, onAddChild, onEdit, onDelete }) {
    const [collapsed, setCollapsed] = useState(false);
    const hasChildren = category.children && category.children.length > 0;

    return (
        <div className={`rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs ${level > 0 ? 'ml-6 border-l-4 border-l-[#c9a96e]' : ''}`}>
            <div className="p-4 flex items-center justify-between gap-4 bg-stone-50/50">
                <div className="flex items-center gap-3">
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => setCollapsed(!collapsed)}
                            className="w-6 h-6 flex items-center justify-center rounded bg-stone-200/80 hover:bg-stone-300 text-stone-700 cursor-pointer transition-colors"
                            title={collapsed ? 'Expand subcategories' : 'Collapse'}
                        >
                            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                    ) : (
                        <span className="w-2 h-2 rounded-full bg-stone-300 inline-block" />
                    )}

                    {category.image_url ? (
                        <img
                            src={category.image_url}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover border border-stone-200 shadow-2xs"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center text-xs font-medium text-stone-500 border border-stone-200">
                            {category.name.slice(0, 2).toUpperCase()}
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-stone-900">{category.name}</span>
                            <span className="text-[11px] font-mono text-stone-400">/{category.slug}</span>
                            <span
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                    category.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-stone-100 text-stone-500'
                                }`}
                            >
                                {category.status}
                            </span>
                            {hasChildren && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#fcf8f0] text-[#9b7633] border border-[#f0e3c8]">
                                    {category.children.length} subcategories
                                </span>
                            )}
                        </div>
                        {category.description && (
                            <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{category.description}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <button
                        type="button"
                        onClick={() => onAddChild(category.id)}
                        className="px-2.5 py-1 text-stone-700 hover:text-black bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer font-medium flex items-center gap-1"
                        title="Add subcategory inside this category"
                    >
                        <Plus className="w-3 h-3" />
                        <span>Add Subcategory</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(category)}
                        className="px-2.5 py-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(category)}
                        className="px-2.5 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {hasChildren && !collapsed && (
                <div className="p-3 bg-white space-y-2 border-t border-stone-100">
                    {category.children.map((child) => (
                        <CategoryCard
                            key={child.id}
                            category={child}
                            level={level + 1}
                            onAddChild={onAddChild}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

