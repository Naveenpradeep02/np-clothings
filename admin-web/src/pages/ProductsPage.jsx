import { useEffect, useState, useMemo } from 'react';
import {
    listProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    addProductImage,
    updateProductImage,
    removeProductImage,
    listProductVariants,
    createVariant,
    updateVariant,
    deleteVariant,
    fetchCategoryTree,
    listCategories,
    listBrands,
    getCategorySpecifications,
} from '../services/api';
import ImageUploader from '../components/ImageUploader';
import {
    Plus,
    Search,
    Sparkles,
    Star,
    Trash2,
    Eye,
    Maximize2,
    Check,
    X,
    Shirt,
    CircleDot,
    Layers,
    Scissors,
    Image as ImageIcon,
    Tag,
    ArrowLeft,
    ChevronRight,
    IndianRupee,
    RefreshCw,
    Sliders,
    Filter,
} from 'lucide-react';


export default function ProductsPage() {
    // List & filter states
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterBrand, setFilterBrand] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [feedback, setFeedback] = useState(null);

    // Reference data
    const [categoryTree, setCategoryTree] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'variants' | 'images' | 'pricing'
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [selectedMainCatId, setSelectedMainCatId] = useState('');
    const [formCategoryId, setFormCategoryId] = useState('');
    const [formBrandId, setFormBrandId] = useState('');
    const [formName, setFormName] = useState('');
    const [formSlug, setFormSlug] = useState('');
    const [formShortDesc, setFormShortDesc] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formMaterial, setFormMaterial] = useState('Pure Linen');
    const [formPattern, setFormPattern] = useState('Solid');
    const [formStatus, setFormStatus] = useState('published');
    const [formFeatured, setFormFeatured] = useState(false);

    // Pricing & inventory defaults
    const [formBasePrice, setFormBasePrice] = useState('2499');
    const [formComparePrice, setFormComparePrice] = useState('3499');
    const [formCostPrice, setFormCostPrice] = useState('1100');
    const [formInitialStock, setFormInitialStock] = useState('20');

    // Images list: Array of { id, url, is_primary, alt_text }
    const [formImages, setFormImages] = useState([]);
    const [tempUploadUrl, setTempUploadUrl] = useState('');
    const [pendingSampleTag, setPendingSampleTag] = useState('Collar');
    const [imageFilterTag, setImageFilterTag] = useState('all');
    const [previewImageUrl, setPreviewImageUrl] = useState(null);


    // Variants & Specifications for the product
    const [categorySpecs, setCategorySpecs] = useState([]); // All groups available for this category
    const [selectedOptionIds, setSelectedOptionIds] = useState([]); // Option IDs enabled for this product
    const [variantsList, setVariantsList] = useState([]); // Array of generated / existing variants
    const [optionPriceDeltas, setOptionPriceDeltas] = useState({}); // { [optionId]: number }
    const [matrixSearch, setMatrixSearch] = useState('');

    // Filtered variants for search in matrix table
    const filteredVariants = useMemo(() => {
        if (!matrixSearch.trim()) return variantsList;
        const q = matrixSearch.toLowerCase();
        return variantsList.filter(
            (v) =>
                (v.sku && v.sku.toLowerCase().includes(q)) ||
                (v.option_names && v.option_names.toLowerCase().includes(q))
        );
    }, [variantsList, matrixSearch]);

    // Load reference catalog data
    async function loadCatalog() {
        try {
            const [treeRes, catRes, brandRes] = await Promise.all([
                fetchCategoryTree(),
                listCategories({ limit: 100 }),
                listBrands({ limit: 100 }),
            ]);
            setCategoryTree(treeRes.data || []);
            setAllCategories(catRes.data || []);
            setBrands(brandRes.data || []);
        } catch (err) {
            console.error('Failed to load catalog data:', err);
        }
    }

    // Load products list
    async function loadProducts() {
        setLoading(true);
        try {
            const res = await listProducts({
                search: search.trim() || undefined,
                categoryId: filterCategory || undefined,
                brandId: filterBrand || undefined,
                status: filterStatus === 'all' ? undefined : filterStatus,
                limit: 100,
            });
            setProducts(res.data || []);
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Failed to load products' });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCatalog();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [search, filterCategory, filterBrand, filterStatus]);

    // Subcategories list for currently selected Main Category in form
    const formSubcategories = useMemo(() => {
        if (!selectedMainCatId) return [];
        const main = categoryTree.find((c) => String(c.id) === String(selectedMainCatId));
        if (!main) return [];
        const list = [];
        (main.children || []).forEach((c) => {
            if (c.children?.length > 0) {
                c.children.forEach((gc) => {
                    list.push({ ...gc, displayName: `${c.name} · ${gc.name}` });
                });
            } else {
                list.push({ ...c, displayName: c.name });
            }
        });
        return list;
    }, [selectedMainCatId, categoryTree]);

    // When category changes in form, fetch the variant set for this subcategory
    useEffect(() => {
        if (!formCategoryId) {
            setCategorySpecs([]);
            return;
        }

        getCategorySpecifications(formCategoryId)
            .then((res) => {
                const data = res.data || {};
                // If subcategory has assigned groups, use them; otherwise use all_groups
                const groups = data.assigned_groups?.length > 0
                    ? data.assigned_groups
                    : data.all_groups || [];
                setCategorySpecs(groups);

                // By default, enable the assigned options for this subcategory
                if (!editingProduct) {
                    const allOptIds = [];
                    groups.forEach((g) => {
                        (g.options || []).forEach((opt) => allOptIds.push(opt.id));
                    });
                    setSelectedOptionIds(allOptIds);
                }
            })
            .catch(() => {});
    }, [formCategoryId]);

    // Open Modal for New Product
    function openCreateModal() {
        setEditingProduct(null);
        setActiveTab('general');

        // Defaults
        const defaultMain = categoryTree[0];
        const defaultSub = defaultMain?.children?.[0];
        const defaultSubId = defaultSub?.id ? String(defaultSub.id) : '';

        setSelectedMainCatId(defaultMain ? String(defaultMain.id) : '');
        setFormCategoryId(defaultSubId);
        setFormBrandId(brands[0]?.id ? String(brands[0].id) : '');
        setFormName('');
        setFormSlug('');
        setFormShortDesc('');
        setFormDesc('');
        setFormMaterial('Pure Linen');
        setFormPattern('Solid');
        setFormStatus('published');
        setFormFeatured(false);
        setFormBasePrice('2499');
        setFormComparePrice('3499');
        setFormCostPrice('1100');
        setFormInitialStock('20');
        setFormImages([]);
        setPendingSampleTag('Collar');
        setImageFilterTag('all');
        setPreviewImageUrl(null);
        setVariantsList([]);
        setSelectedOptionIds([]);
        setOptionPriceDeltas({});
        setMatrixSearch('');
        setModalOpen(true);
    }

    // Open Modal for Edit Product
    async function openEditModal(prod) {
        setEditingProduct(prod);
        setActiveTab('general');
        setPendingSampleTag('Collar');
        setImageFilterTag('all');
        setPreviewImageUrl(null);
        setOptionPriceDeltas({});
        setMatrixSearch('');
        setModalOpen(true);

        try {
            const [detailRes, variantsRes] = await Promise.all([
                getProduct(prod.id),
                listProductVariants(prod.id),
            ]);
            const p = detailRes.data || prod;

            // Find parent category to set selectedMainCatId
            const sub = allCategories.find((c) => String(c.id) === String(p.category_id));
            if (sub?.parent_id) {
                // Check if grandparent or parent
                const parent = allCategories.find((c) => String(c.id) === String(sub.parent_id));
                const mainId = parent?.parent_id || parent?.id || sub.parent_id;
                setSelectedMainCatId(String(mainId));
            }

            setFormCategoryId(String(p.category_id || ''));
            setFormBrandId(p.brand_id ? String(p.brand_id) : '');
            setFormName(p.name || '');
            setFormSlug(p.slug || '');
            setFormShortDesc(p.short_description || '');
            setFormDesc(p.description || '');
            setFormMaterial(p.base_material || 'Pure Linen');
            setFormPattern(p.design_pattern || 'Solid');
            setFormStatus(p.status || 'published');
            setFormFeatured(Boolean(p.is_featured));

            // Set images
            setFormImages(p.images || []);

            // Set variants
            const loadedVariants = (variantsRes.data || []).map((v) => ({
                id: v.id,
                sku: v.sku,
                price: v.price,
                compare_at_price: v.compare_at_price,
                stock: v.inventory?.quantity || 0,
                option_ids: v.options?.map((o) => o.id) || [],
                option_names: v.options?.map((o) => o.name).join(' · ') || '',
            }));
            setVariantsList(loadedVariants);

            if (loadedVariants.length > 0) {
                setFormBasePrice(String(loadedVariants[0].price || '2499'));
            }
        } catch (err) {
            console.error('Failed to load product details:', err);
        }
    }

    // Auto-generate slug from name
    function handleNameChange(val) {
        setFormName(val);
        if (!editingProduct) {
            const autoSlug = val
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_]+/g, '-');
            setFormSlug(autoSlug);
        }
    }

    // Toggle option checkbox for product
    function toggleOptionId(id) {
        setSelectedOptionIds((prev) =>
            prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id]
        );
    }

    // Sample type definitions for custom garment features
    const SAMPLE_TAG_OPTIONS = [
        { id: 'Collar', label: 'Collar Sample', icon: Shirt, badge: 'bg-amber-50 text-amber-800 border-amber-200' },
        { id: 'Button', label: 'Button Sample', icon: CircleDot, badge: 'bg-blue-50 text-blue-800 border-blue-200' },
        { id: 'Placket', label: 'Placket Sample', icon: Layers, badge: 'bg-purple-50 text-purple-800 border-purple-200' },
        { id: 'Cuff', label: 'Cuff Sample', icon: Scissors, badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
        { id: 'Front View', label: 'Front View', icon: Eye, badge: 'bg-stone-100 text-stone-800 border-stone-200' },
        { id: 'Back View', label: 'Back View', icon: Eye, badge: 'bg-stone-100 text-stone-800 border-stone-200' },
        { id: 'Fabric Detail', label: 'Fabric / Texture', icon: Tag, badge: 'bg-rose-50 text-rose-800 border-rose-200' },
        { id: 'General', label: 'General Gallery', icon: ImageIcon, badge: 'bg-stone-50 text-stone-600 border-stone-200' },
    ];


    // Add Single Image to Product
    function handleAddImage(url) {
        if (!url) return;
        const isPrimary = formImages.length === 0;
        setFormImages((prev) => [
            ...prev,
            { url, is_primary: isPrimary, alt_text: pendingSampleTag || 'General' },
        ]);
        setTempUploadUrl('');
    }

    // Add Multiple Images to Product (Batch Upload)
    function handleAddMultipleImages(urls) {
        if (!urls || urls.length === 0) return;
        const isFirst = formImages.length === 0;
        const newImages = urls.map((url, i) => ({
            url,
            is_primary: isFirst && i === 0,
            alt_text: pendingSampleTag || 'General',
        }));
        setFormImages((prev) => [...prev, ...newImages]);
    }

    function handleUpdateImageTag(index, newTag) {
        setFormImages((prev) =>
            prev.map((img, i) => (i === index ? { ...img, alt_text: newTag } : img))
        );
    }

    function handleRemoveImage(index) {
        const next = formImages.filter((_, i) => i !== index);
        // If removed image was primary, make first remaining primary
        if (formImages[index]?.is_primary && next.length > 0) {
            next[0].is_primary = true;
        }
        setFormImages(next);
    }

    function handleSetPrimaryImage(index) {
        setFormImages((prev) =>
            prev.map((img, i) => ({
                ...img,
                is_primary: i === index,
            }))
        );
    }


    // Auto-Generate Variants Matrix from selected options with price variations
    function handleGenerateVariantsMatrix() {
        if (!formName.trim()) {
            alert('Please enter a product name first to generate SKUs');
            return;
        }

        const basePriceNum = Number(formBasePrice) || 2499;
        const baseCompareNum = formComparePrice ? Number(formComparePrice) : null;
        const stockNum = Number(formInitialStock) || 20;

        // Group selected options by their groups
        const activeGroups = categorySpecs
            .map((g) => ({
                ...g,
                selectedOpts: (g.options || []).filter((o) => selectedOptionIds.includes(o.id)),
            }))
            .filter((g) => g.selectedOpts.length > 0);

        if (activeGroups.length === 0) {
            // Generate a default single variant
            const baseSku = `${formSlug.toUpperCase().slice(0, 10)}-STD`;
            setVariantsList([
                {
                    sku: baseSku,
                    price: basePriceNum,
                    compare_at_price: baseCompareNum,
                    stock: stockNum,
                    option_ids: [],
                    option_names: 'Standard Edition',
                    extra_price: 0,
                },
            ]);
            return;
        }

        // Cartesian product of options across selected groups
        function cartesian(arr) {
            return arr.reduce(
                (a, b) => a.flatMap((d) => b.selectedOpts.map((e) => [...d, e])),
                [[]]
            );
        }

        const combinations = cartesian(activeGroups);
        const prefix = (formSlug || 'PROD').toUpperCase().slice(0, 8);

        const newVariants = combinations.map((combo) => {
            const skuParts = combo.map((o) => o.code.toUpperCase().slice(0, 4));
            const sku = `${prefix}-${skuParts.join('-')}`;
            const option_names = combo.map((o) => o.name).join(' · ');
            const option_ids = combo.map((o) => o.id);

            // Compute total price variation delta for this combination (Size + Color + Collar + Button, etc.)
            const extraPrice = combo.reduce((sum, o) => sum + (Number(optionPriceDeltas[o.id]) || 0), 0);
            const calculatedPrice = basePriceNum + extraPrice;
            const calculatedCompare = baseCompareNum ? baseCompareNum + extraPrice : null;

            return {
                sku,
                price: calculatedPrice,
                compare_at_price: calculatedCompare,
                stock: stockNum,
                option_ids,
                option_names,
                extra_price: extraPrice,
            };
        });

        setVariantsList(newVariants);
        setFeedback({
            type: 'success',
            message: `Generated ${newVariants.length} variant combinations with tailored price variations!`,
        });
    }

    // Apply or recalculate price variations to existing variant matrix
    function handleApplyPriceDeltasToMatrix() {
        const basePriceNum = Number(formBasePrice) || 2499;
        const baseCompareNum = formComparePrice ? Number(formComparePrice) : null;

        setVariantsList((prev) =>
            prev.map((v) => {
                const extraPrice = (v.option_ids || []).reduce(
                    (sum, optId) => sum + (Number(optionPriceDeltas[optId]) || 0),
                    0
                );
                return {
                    ...v,
                    price: basePriceNum + extraPrice,
                    compare_at_price: baseCompareNum ? baseCompareNum + extraPrice : v.compare_at_price,
                    extra_price: extraPrice,
                };
            })
        );
        setFeedback({
            type: 'success',
            message: 'Price variations recalculated across all variant combinations!',
        });
    }

    // Submit Product (Create or Update with images, specs, variants)
    async function handleSubmit(e) {
        if (e?.preventDefault) e.preventDefault();
        if (!formName.trim() || !formCategoryId) {
            setFeedback({ type: 'error', message: 'Product Name and Category are required' });
            return;
        }

        setSubmitting(true);
        setFeedback(null);

        try {
            const productPayload = {
                name: formName.trim(),
                slug: formSlug.trim(),
                category_id: Number(formCategoryId),
                brand_id: formBrandId ? Number(formBrandId) : null,
                short_description: formShortDesc.trim() || null,
                description: formDesc.trim() || null,
                base_material: formMaterial.trim() || null,
                design_pattern: formPattern.trim() || null,
                status: formStatus,
                is_featured: formFeatured,
                specification_group_ids: categorySpecs.map((g) => g.id),
                specification_option_ids: selectedOptionIds,
            };

            let targetProductId;

            if (editingProduct) {
                targetProductId = editingProduct.id;
                await updateProduct(targetProductId, productPayload);
            } else {
                const res = await createProduct(productPayload);
                targetProductId = res.data.id;
            }

            // Sync Images: Add newly uploaded images, update tags/primary, and remove deleted images
            if (editingProduct) {
                const currentIds = formImages.filter((img) => img.id).map((img) => img.id);
                const initialImages = editingProduct.images || [];
                for (const oldImg of initialImages) {
                    if (!currentIds.includes(oldImg.id)) {
                        try {
                            await removeProductImage(targetProductId, oldImg.id);
                        } catch (err) {
                            console.warn('Failed removing image:', err);
                        }
                    }
                }
            }

            if (formImages.length > 0) {
                for (let i = 0; i < formImages.length; i++) {
                    const img = formImages[i];
                    if (!img.id) {
                        await addProductImage(targetProductId, {
                            url: img.url,
                            alt_text: img.alt_text || 'General',
                            is_primary: Boolean(img.is_primary),
                            sort_order: i,
                        });
                    } else {
                        await updateProductImage(targetProductId, img.id, {
                            alt_text: img.alt_text || 'General',
                            is_primary: Boolean(img.is_primary),
                            sort_order: i,
                        });
                    }
                }
            }


            // Create or update Variants with tailored prices & stock
            if (variantsList.length > 0) {
                for (const v of variantsList) {
                    if (!v.id) {
                        try {
                            await createVariant({
                                product_id: targetProductId,
                                sku: v.sku,
                                price: Number(v.price) || 2499,
                                compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
                                initial_stock: Number(v.stock) || 0,
                                option_ids: v.option_ids,
                                status: 'active',
                            });
                        } catch (varErr) {
                            console.warn('Variant creation warning:', varErr.message);
                        }
                    } else {
                        try {
                            await updateVariant(v.id, {
                                price: Number(v.price) || 2499,
                                compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
                                status: 'active',
                            });
                        } catch (varErr) {
                            console.warn('Variant update warning:', varErr.message);
                        }
                    }
                }
            }

            setFeedback({
                type: 'success',
                message: `Product "${formName}" ${editingProduct ? 'updated' : 'created with all features'} successfully!`,
            });
            setModalOpen(false);
            await loadProducts();
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Operation failed' });
        } finally {
            setSubmitting(false);
        }
    }

    // Toggle quick publish
    async function handleTogglePublish(prod) {
        const next = prod.status === 'published' ? 'draft' : 'published';
        try {
            await updateProduct(prod.id, { status: next });
            await loadProducts();
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Status update failed' });
        }
    }

    // Delete Product
    async function handleDeleteProduct(prod) {
        if (!window.confirm(`Are you sure you want to delete product "${prod.name}"?`)) return;
        try {
            await deleteProduct(prod.id);
            setFeedback({ type: 'success', message: `Product "${prod.name}" deleted` });
            await loadProducts();
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Delete failed' });
        }
    }

    return (
        <div className="space-y-6">
            {!modalOpen ? (
                <>
                    {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
                <div>
                    <h1 className="text-xl font-serif text-stone-900 tracking-tight">Products Management</h1>
                    <p className="text-xs text-stone-500 mt-1">
                        Add and configure products with categories, brands, images, prices, and variant combinations
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="px-4 py-2.5 text-xs font-medium text-white bg-stone-900 hover:bg-black rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                    >
                        <span className="text-sm leading-none">+</span>
                        <span>Add New Product</span>
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

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="search"
                        placeholder="Search product by name or slug…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-stone-900"
                    />
                </div>

                {/* Category Filter */}
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:bg-white focus:outline-none focus:border-stone-900"
                >
                    <option value="">All Categories</option>
                    {allCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.parent_id ? `↳ ${c.name}` : `• ${c.name}`}
                        </option>
                    ))}
                </select>

                {/* Brand Filter */}
                <select
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:bg-white focus:outline-none focus:border-stone-900"
                >
                    <option value="">All Brands</option>
                    {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.name}
                        </option>
                    ))}
                </select>

                {/* Status Filter */}
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:bg-white focus:outline-none focus:border-stone-900"
                >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                </select>

                <div className="text-stone-400 text-xs px-2">
                    Total: <strong className="text-stone-900">{products.length}</strong>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-[11px] font-semibold text-stone-500 uppercase border-b border-stone-200">
                        <tr>
                            <th className="px-5 py-3.5">Product</th>
                            <th className="px-4 py-3.5">Category</th>
                            <th className="px-4 py-3.5">Brand</th>
                            <th className="px-4 py-3.5">Material / Pattern</th>
                            <th className="px-4 py-3.5">Status</th>
                            <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-12 text-center text-stone-400">
                                    Loading products…
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-12 text-center text-stone-400">
                                    No products found. Click "Add New Product" to create your first item!
                                </td>
                            </tr>
                        ) : (
                            products.map((p) => (
                                <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                                    {/* Product Thumbnail & Name */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            {p.primary_image?.url ? (
                                                <img
                                                    src={p.primary_image.url}
                                                    alt={p.name}
                                                    className="w-11 h-11 rounded-lg object-cover border border-stone-200 bg-stone-50 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center font-serif text-xs font-semibold text-stone-600 shrink-0">
                                                    {p.name.slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-stone-900 text-sm">{p.name}</p>
                                                <p className="text-[11px] font-mono text-stone-400 mt-0.5">/{p.slug}</p>
                                                {p.min_price != null && (
                                                    <p className="text-[11px] font-medium text-[#8c6b2d] mt-0.5">
                                                        ₹{Number(p.min_price).toLocaleString('en-IN')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Category */}
                                    <td className="px-4 py-3.5 text-stone-700">
                                        <span className="px-2 py-1 rounded bg-stone-100 font-medium text-[11px]">
                                            {p.category_name || 'Unassigned'}
                                        </span>
                                    </td>

                                    {/* Brand */}
                                    <td className="px-4 py-3.5 text-stone-700 font-medium">
                                        {p.brand_name || '—'}
                                    </td>

                                    {/* Material / Pattern */}
                                    <td className="px-4 py-3.5 text-stone-500">
                                        <div>
                                            <span>{p.base_material || 'Pure Linen'}</span>
                                            {p.design_pattern && (
                                                <span className="text-[11px] text-stone-400 block">
                                                    Pattern: {p.design_pattern}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3.5">
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                                p.status === 'published'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : p.status === 'archived'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    : 'bg-stone-100 text-stone-600 border border-stone-200'
                                            }`}
                                        >
                                            {p.status}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3.5 text-right space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(p)}
                                            className="px-2.5 py-1 text-stone-700 hover:text-black bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTogglePublish(p)}
                                            className="px-2 py-1 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                                        >
                                            {p.status === 'published' ? 'Unpublish' : 'Publish'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteProduct(p)}
                                            className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            </>
            ) : (
                <div className="space-y-6 pb-16 animate-in fade-in duration-150">
                    {/* FULL-PAGE EDITOR HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="px-3.5 py-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-colors cursor-pointer flex items-center gap-2 text-xs font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back to Products</span>
                            </button>
                            <div className="h-6 w-px bg-stone-200 hidden sm:block" />
                            <div>
                                <h1 className="text-xl font-serif text-stone-900 tracking-tight">
                                    {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product'}
                                </h1>
                                <p className="text-xs text-stone-500 mt-0.5">
                                    Configure taxonomy, images, pricing, and customizable variant options
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-6 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-black rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting
                                    ? 'Saving Product…'
                                    : editingProduct
                                    ? 'Save Changes'
                                    : 'Create Product'}
                            </button>
                        </div>
                    </div>

                    {/* Editor Card with Tabs */}
                    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
                        {/* Tabs Navigation */}
                        <div className="flex border-b border-stone-200 bg-stone-50/70 px-6 shrink-0 text-xs overflow-x-auto">
                            {[
                                { id: 'general', label: '1. Basic Info & Taxonomy' },
                                { id: 'variants', label: `2. Variant Customizations (${variantsList.length})` },
                                { id: 'images', label: `3. Product Images (${formImages.length})` },
                                { id: 'pricing', label: '4. Pricing & Inventory' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-6 font-medium transition-all cursor-pointer border-b-2 -mb-px shrink-0 ${
                                        activeTab === tab.id
                                            ? 'border-stone-900 text-stone-900 font-semibold bg-white'
                                            : 'border-transparent text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Editor Body Form (Full Page) */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            {/* TAB 1: BASIC INFO & TAXONOMY */}
                            {activeTab === 'general' && (
                                <div className="space-y-4">
                                    {/* Category Cascade */}
                                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
                                            Category Hierarchy
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                                    Main Category <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={selectedMainCatId}
                                                    onChange={(e) => {
                                                        setSelectedMainCatId(e.target.value);
                                                        const main = categoryTree.find((c) => String(c.id) === e.target.value);
                                                        const firstSub = main?.children?.[0];
                                                        setFormCategoryId(firstSub?.id ? String(firstSub.id) : '');
                                                    }}
                                                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                                                >
                                                    <option value="">Select Main Category</option>
                                                    {categoryTree.map((c) => (
                                                        <option key={c.id} value={c.id}>
                                                            • {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                                    Subcategory (Apparel Type) <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    required
                                                    value={formCategoryId}
                                                    onChange={(e) => setFormCategoryId(e.target.value)}
                                                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                                                >
                                                    <option value="">Select Subcategory</option>
                                                    {formSubcategories.map((sub) => (
                                                        <option key={sub.id} value={sub.id}>
                                                            ↳ {sub.displayName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Name & Brand */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-medium text-stone-700 mb-1">
                                                Product Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Pure Linen Mandarin Collar Shirt"
                                                value={formName}
                                                onChange={(e) => handleNameChange(e.target.value)}
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-stone-700 mb-1">
                                                Brand
                                            </label>
                                            <select
                                                value={formBrandId}
                                                onChange={(e) => setFormBrandId(e.target.value)}
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                            >
                                                <option value="">None / House Brand</option>
                                                {brands.map((b) => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Slug & Fabric details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-stone-700 mb-1">
                                                URL Slug
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formSlug}
                                                onChange={(e) => setFormSlug(e.target.value)}
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-stone-700 mb-1">
                                                Base Material
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Pure Linen, 100% Cotton, Silk"
                                                value={formMaterial}
                                                onChange={(e) => setFormMaterial(e.target.value)}
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-stone-700 mb-1">
                                                Design Pattern
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Solid, Striped, Checked, Printed"
                                                value={formPattern}
                                                onChange={(e) => setFormPattern(e.target.value)}
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                            />
                                        </div>
                                    </div>

                                    {/* Status & Featured */}
                                    <div className="flex items-center gap-6 p-3 bg-stone-50 rounded-xl border border-stone-200">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-medium text-stone-700">Status:</label>
                                            <select
                                                value={formStatus}
                                                onChange={(e) => setFormStatus(e.target.value)}
                                                className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                                            >
                                                <option value="published">Published (Visible in Shop)</option>
                                                <option value="draft">Draft</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                        </div>

                                        <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formFeatured}
                                                onChange={(e) => setFormFeatured(e.target.checked)}
                                                className="w-4 h-4 rounded text-stone-900 cursor-pointer"
                                            />
                                            <span>Featured on Homepage</span>
                                        </label>
                                    </div>

                                    {/* Descriptions */}
                                    <div>
                                        <label className="block text-xs font-medium text-stone-700 mb-1">
                                            Short Description (Card summary)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Configurable pure linen shirt with tailored collar and cuffs"
                                            value={formShortDesc}
                                            onChange={(e) => setFormShortDesc(e.target.value)}
                                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-stone-700 mb-1">
                                            Full Description & Story
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="Detailed product story, fabric weave, styling advice, and care instructions..."
                                            value={formDesc}
                                            onChange={(e) => setFormDesc(e.target.value)}
                                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: VARIANT CUSTOMIZATIONS (Collar, Buttons, Sleeves, Fit, Size) */}
                            {activeTab === 'variants' && (
                                <div className="space-y-5">
                                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                                                    Subcategory Variables Configurator
                                                </h3>
                                                <p className="text-[11px] text-stone-400">
                                                    Check which options (Chinese Collar, Normal Collar, Press Button, Size, etc.) this product offers.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleGenerateVariantsMatrix}
                                                className="px-3.5 py-1.5 bg-[#8c6b2d] hover:bg-[#725520] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span>Generate Variant Combinations</span>
                                            </button>
                                        </div>

                                        {categorySpecs.length === 0 ? (
                                            <p className="text-xs text-stone-400 italic">
                                                No variant sets configured for this subcategory yet. You can configure them in the "Variant Sets" page.
                                            </p>
                                        ) : (
                                            <div className="space-y-3 pt-2">
                                                {categorySpecs.map((group) => (
                                                    <div key={group.id} className="bg-white p-3 rounded-xl border border-stone-200/80">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                                                                <Tag className="w-3.5 h-3.5 text-stone-400" />
                                                                <span>{group.name}</span>
                                                                <span className="text-[10px] text-stone-400 font-mono">#{group.code}</span>
                                                            </span>
                                                            <span className="text-[10px] text-stone-400">
                                                                {(group.options || []).filter((o) => selectedOptionIds.includes(o.id)).length} selected
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(group.options || []).map((opt) => {
                                                                const checked = selectedOptionIds.includes(opt.id);
                                                                return (
                                                                    <div
                                                                        key={opt.id}
                                                                        className={`inline-flex items-center rounded-lg border text-xs font-medium transition-all ${
                                                                            checked
                                                                                ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                                                                                : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200/70'
                                                                        }`}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleOptionId(opt.id)}
                                                                            className="px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
                                                                        >
                                                                            {checked ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3 text-stone-400" />}
                                                                            <span>{opt.name}</span>
                                                                        </button>
                                                                        {checked && (
                                                                            <div className="flex items-center pr-2 pl-1.5 py-0.5 border-l border-stone-700/80 bg-stone-950/40 rounded-r-lg">
                                                                                <span className="text-[10px] text-stone-400 font-mono mr-1">+₹</span>
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    step="10"
                                                                                    placeholder="0"
                                                                                    value={optionPriceDeltas[opt.id] ?? ''}
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value;
                                                                                        setOptionPriceDeltas((prev) => ({
                                                                                            ...prev,
                                                                                            [opt.id]: val === '' ? '' : Number(val),
                                                                                        }));
                                                                                    }}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    className="w-14 bg-stone-800 text-amber-300 text-xs px-1.5 py-0.5 rounded border border-stone-600 focus:outline-none focus:border-amber-400 text-right font-mono"
                                                                                    title={`Price variation for ${opt.name} (+₹)`}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Generated Variants Table */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                                                Sellable Variant Items ({variantsList.length})
                                            </h4>
                                            {variantsList.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setVariantsList([])}
                                                    className="text-[11px] text-red-600 hover:underline cursor-pointer flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    <span>Clear All Variants</span>
                                                </button>
                                            )}
                                        </div>

                                        {variantsList.length === 0 ? (
                                            <div className="p-6 text-center bg-stone-50/50 rounded-2xl border border-stone-200 text-xs text-stone-400">
                                                No variant rows generated yet. Click "Generate Variant Combinations" to generate SKUs and pricing matrix.
                                            </div>
                                        ) : (
                                            <div className="border border-stone-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-stone-50 text-[10px] uppercase font-semibold text-stone-500 border-b border-stone-200 sticky top-0">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left">SKU</th>
                                                            <th className="px-3 py-2 text-left">Variables Combination</th>
                                                            <th className="px-3 py-2 text-left w-24">Price (₹)</th>
                                                            <th className="px-3 py-2 text-left w-20">Stock</th>
                                                            <th className="px-2 py-2 text-right"/>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-stone-100">
                                                        {variantsList.map((v, vIdx) => (
                                                            <tr key={vIdx} className="hover:bg-stone-50/50">
                                                                <td className="px-3 py-2 font-mono font-medium text-stone-800">
                                                                    {v.sku}
                                                                </td>
                                                                <td className="px-3 py-2 text-stone-600">
                                                                    {v.option_names}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <input
                                                                        type="number"
                                                                        value={v.price}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            setVariantsList((prev) =>
                                                                                prev.map((item, idx) =>
                                                                                    idx === vIdx ? { ...item, price: val } : item
                                                                                )
                                                                            );
                                                                        }}
                                                                        className="w-full border border-stone-200 rounded px-1.5 py-0.5 text-xs text-stone-900 bg-white"
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <input
                                                                        type="number"
                                                                        value={v.stock}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            setVariantsList((prev) =>
                                                                                prev.map((item, idx) =>
                                                                                    idx === vIdx ? { ...item, stock: val } : item
                                                                                )
                                                                            );
                                                                        }}
                                                                        className="w-full border border-stone-200 rounded px-1.5 py-0.5 text-xs text-stone-900 bg-white"
                                                                    />
                                                                </td>
                                                                <td className="px-2 py-2 text-right">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setVariantsList(variantsList.filter((_, idx) => idx !== vIdx))
                                                                        }
                                                                        className="text-stone-400 hover:text-red-600 cursor-pointer p-1"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: PRODUCT IMAGES */}
                            {activeTab === 'images' && (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                                                Product Media Gallery & Sample Types
                                            </h3>
                                            <p className="text-[11px] text-stone-400">
                                                Upload multiple photos at once. Label Collar, Button, Placket, Cuff samples, and angles so customers can preview all types.
                                            </p>
                                        </div>
                                    </div>

                                    {/* 1. Fast Preset Sample Tag Selector for upcoming uploads */}
                                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                                                1. Select Tag for upcoming uploads:
                                            </span>
                                            <span className="text-[10px] text-stone-400">
                                                New files will be tagged as: <strong className="text-stone-800 font-semibold">{pendingSampleTag}</strong>
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {SAMPLE_TAG_OPTIONS.map((tag) => {
                                                const isActive = pendingSampleTag === tag.id;
                                                const TagIcon = tag.icon;
                                                return (
                                                    <button
                                                        key={tag.id}
                                                        type="button"
                                                        onClick={() => setPendingSampleTag(tag.id)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                                                            isActive
                                                                ? 'bg-stone-900 text-white border-stone-900 shadow-2xs scale-[1.02]'
                                                                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:bg-stone-100/70'
                                                        }`}
                                                    >
                                                        {TagIcon && <TagIcon className="w-3.5 h-3.5" />}
                                                        <span>{tag.label}</span>
                                                        {isActive && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 2. Image Uploader Component (Multiple supported) */}
                                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                                        <ImageUploader
                                            label={`2. Upload Photos to Product (Auto-tagged as "${pendingSampleTag}")`}
                                            folder="products"
                                            multiple={true}
                                            value={tempUploadUrl}
                                            onUploadMultiple={handleAddMultipleImages}
                                            onChange={handleAddImage}
                                        />
                                    </div>

                                    {/* 3. Uploaded Images Gallery Header & Filter Tabs */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                                                    Uploaded Gallery Photos ({formImages.length})
                                                </h4>
                                                {formImages.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormImages([])}
                                                        className="text-[10px] text-red-500 hover:underline cursor-pointer ml-2 flex items-center gap-1"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        <span>Remove All</span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Tag Filter Pills */}
                                            {formImages.length > 0 && (
                                                <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => setImageFilterTag('all')}
                                                        className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                                                            imageFilterTag === 'all'
                                                                ? 'bg-stone-800 text-white'
                                                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                                        }`}
                                                    >
                                                        All ({formImages.length})
                                                    </button>
                                                    {['Collar', 'Button', 'Placket', 'Cuff'].map((t) => {
                                                        const count = formImages.filter((img) => (img.alt_text || '').toLowerCase().includes(t.toLowerCase())).length;
                                                        if (count === 0) return null;
                                                        return (
                                                            <button
                                                                key={t}
                                                                type="button"
                                                                onClick={() => setImageFilterTag(t)}
                                                                className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                                                                    imageFilterTag === t
                                                                        ? 'bg-stone-800 text-white'
                                                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                                                }`}
                                                            >
                                                                {t} ({count})
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {formImages.length === 0 ? (
                                            <div className="p-8 text-center bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 text-xs text-stone-400">
                                                No images uploaded yet. Select a sample tag above and choose photos to upload multiple files at once.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                                                {formImages
                                                    .map((img, idx) => ({ img, idx }))
                                                    .filter(({ img }) => {
                                                        if (imageFilterTag === 'all') return true;
                                                        return (img.alt_text || '').toLowerCase().includes(imageFilterTag.toLowerCase());
                                                    })
                                                    .map(({ img, idx }) => {
                                                        const tagMeta = SAMPLE_TAG_OPTIONS.find((t) => t.id === img.alt_text) || {
                                                            label: img.alt_text || 'General Gallery',
                                                            badge: 'bg-stone-100 text-stone-700 border-stone-200',
                                                            icon: ImageIcon,
                                                        };
                                                        const TagIcon = tagMeta.icon || ImageIcon;

                                                        return (
                                                            <div
                                                                key={idx}
                                                                className={`group relative rounded-xl border p-2 bg-white flex flex-col justify-between shadow-2xs transition-all ${
                                                                    img.is_primary
                                                                        ? 'border-stone-900 ring-2 ring-stone-900/10'
                                                                        : 'border-stone-200 hover:border-stone-300'
                                                                }`}
                                                            >
                                                                {/* Image Thumbnail with zoom trigger */}
                                                                <div className="relative w-full h-32 rounded-lg bg-stone-100 overflow-hidden mb-2">
                                                                    <img
                                                                        src={img.url}
                                                                        alt={img.alt_text || 'Product'}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPreviewImageUrl(img.url)}
                                                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity cursor-pointer gap-1.5"
                                                                    >
                                                                        <Maximize2 className="w-3.5 h-3.5" />
                                                                        <span>Enlarge</span>
                                                                    </button>

                                                                    {/* Top Floating Badge */}
                                                                    <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shadow-2xs flex items-center gap-1 ${tagMeta.badge}`}>
                                                                            <TagIcon className="w-3 h-3" />
                                                                            <span>{tagMeta.label}</span>
                                                                        </span>
                                                                        {img.is_primary && (
                                                                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
                                                                                <Star className="w-3 h-3 fill-emerald-700 text-emerald-700" />
                                                                                <span>Primary</span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Tag Dropdown & Card Controls */}
                                                                <div className="space-y-1.5 pt-1 border-t border-stone-100 text-[11px]">
                                                                    <div>
                                                                        <label className="text-[10px] font-medium text-stone-400 block mb-0.5">
                                                                            Sample Type:
                                                                        </label>
                                                                        <select
                                                                            value={img.alt_text || 'General'}
                                                                            onChange={(e) => handleUpdateImageTag(idx, e.target.value)}
                                                                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-[11px] text-stone-800 focus:bg-white focus:outline-none focus:border-stone-900 cursor-pointer"
                                                                        >
                                                                            {SAMPLE_TAG_OPTIONS.map((tag) => (
                                                                                <option key={tag.id} value={tag.id}>
                                                                                    {tag.label}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div className="flex items-center justify-between pt-1 text-[10px]">
                                                                        {img.is_primary ? (
                                                                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                                                                                <Check className="w-3 h-3" />
                                                                                <span>Main Photo</span>
                                                                            </span>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSetPrimaryImage(idx)}
                                                                                className="text-stone-500 hover:text-stone-900 underline cursor-pointer flex items-center gap-1"
                                                                            >
                                                                                <Star className="w-3 h-3" />
                                                                                <span>Make Primary</span>
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveImage(idx)}
                                                                            className="text-red-500 hover:text-red-700 cursor-pointer font-medium flex items-center gap-1"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                            <span>Remove</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}


                            {/* TAB 4: PRICING & INVENTORY */}
                            {activeTab === 'pricing' && (
                                <div className="space-y-6">
                                    {/* 1. Base Product Pricing Card */}
                                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                                        <div>
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                                                <IndianRupee className="w-3.5 h-3.5 text-[#8c6b2d]" />
                                                <span>1. Base Product Pricing & Default Stock</span>
                                            </h3>
                                            <p className="text-[11px] text-stone-400">
                                                Standard price for standard options. Any selected option variations will add to this base price.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                                    Base Selling Price (₹) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    placeholder="2499"
                                                    value={formBasePrice}
                                                    onChange={(e) => setFormBasePrice(e.target.value)}
                                                    className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900 shadow-2xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                                    Compare At / MRP Price (₹)
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="3499"
                                                    value={formComparePrice}
                                                    onChange={(e) => setFormComparePrice(e.target.value)}
                                                    className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900 shadow-2xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                                    Cost Price per unit (₹)
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="1100"
                                                    value={formCostPrice}
                                                    onChange={(e) => setFormCostPrice(e.target.value)}
                                                    className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900 shadow-2xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                                    Initial Stock per Variant
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="20"
                                                    value={formInitialStock}
                                                    onChange={(e) => setFormInitialStock(e.target.value)}
                                                    className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900 shadow-2xs"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Option Price Variations (Size, Color, Collar, Button) */}
                                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                                                    <Sliders className="w-3.5 h-3.5 text-[#8c6b2d]" />
                                                    <span>2. Price Variations for Size, Color, Collar, & Button (+₹ Surcharges)</span>
                                                </h3>
                                                <p className="text-[11px] text-stone-400 mt-0.5">
                                                    Configure extra surcharge for premium options (e.g. Size XXL +₹200, Chinese Collar +₹150, Press Button +₹100).
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleApplyPriceDeltasToMatrix}
                                                className="px-3.5 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0 self-start sm:self-auto"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                                                <span>Apply Variations to Matrix</span>
                                            </button>
                                        </div>

                                        {categorySpecs.length === 0 ? (
                                            <p className="text-xs text-stone-400 italic">
                                                No variant sets selected for this category yet.
                                            </p>
                                        ) : (
                                            <div className="space-y-3">
                                                {categorySpecs.map((group) => {
                                                    const activeOpts = (group.options || []).filter((o) => selectedOptionIds.includes(o.id));
                                                    if (activeOpts.length === 0) return null;

                                                    return (
                                                        <div key={group.id} className="bg-white p-3.5 rounded-xl border border-stone-200/90 shadow-2xs">
                                                            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-100">
                                                                <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                                                                    <Tag className="w-3 h-3 text-stone-400" />
                                                                    <span>{group.name} Variations</span>
                                                                </span>
                                                                <span className="text-[10px] text-stone-400 uppercase tracking-wider">
                                                                    {activeOpts.length} active options
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                                                                {activeOpts.map((opt) => {
                                                                    const delta = Number(optionPriceDeltas[opt.id]) || 0;
                                                                    const calculated = (Number(formBasePrice) || 0) + delta;
                                                                    return (
                                                                        <div
                                                                            key={opt.id}
                                                                            className={`p-2.5 rounded-xl border transition-all ${
                                                                                delta > 0
                                                                                    ? 'bg-amber-50/50 border-amber-300/80 shadow-2xs'
                                                                                    : 'bg-stone-50 border-stone-200'
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                                                <span className="text-xs font-medium text-stone-800 truncate" title={opt.name}>
                                                                                    {opt.name}
                                                                                </span>
                                                                                {delta > 0 && (
                                                                                    <span className="text-[9px] font-semibold text-amber-800 bg-amber-100/90 px-1 py-0.5 rounded">
                                                                                        +₹{delta}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-1 mt-1">
                                                                                <span className="text-[11px] text-stone-400 font-mono">+₹</span>
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    step="10"
                                                                                    placeholder="0"
                                                                                    value={optionPriceDeltas[opt.id] ?? ''}
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value;
                                                                                        setOptionPriceDeltas((prev) => ({
                                                                                            ...prev,
                                                                                            [opt.id]: val === '' ? '' : Number(val),
                                                                                        }));
                                                                                    }}
                                                                                    className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-900 font-semibold focus:outline-none focus:border-stone-900"
                                                                                />
                                                                            </div>
                                                                            <div className="text-[10px] text-stone-400 mt-1.5 flex justify-between">
                                                                                <span>Option total:</span>
                                                                                <span className="font-semibold text-stone-700">₹{calculated}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Variant Combinations Pricing & Inventory Matrix */}
                                    <div className="p-4 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                                                    <Shirt className="w-3.5 h-3.5 text-stone-500" />
                                                    <span>3. Sellable Variant Matrix & Pricing Table ({variantsList.length} Items)</span>
                                                </h3>
                                                <p className="text-[11px] text-stone-400">
                                                    Review or manually override each combination SKU, final selling price, and available stock units.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateVariantsMatrix}
                                                    className="px-3 py-1.5 bg-[#8c6b2d] hover:bg-[#725520] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                                >
                                                    <Sparkles className="w-3 h-3" />
                                                    <span>Regenerate Matrix</span>
                                                </button>
                                                {variantsList.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setVariantsList([])}
                                                        className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        <span>Clear</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Matrix Search Filter */}
                                        {variantsList.length > 0 && (
                                            <div className="relative">
                                                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="search"
                                                    placeholder="Filter combinations by Size (e.g. XXL), Collar (e.g. Chinese), Button, or SKU..."
                                                    value={matrixSearch}
                                                    onChange={(e) => setMatrixSearch(e.target.value)}
                                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-stone-900"
                                                />
                                            </div>
                                        )}

                                        {variantsList.length === 0 ? (
                                            <div className="p-8 text-center bg-stone-50/50 rounded-xl border border-dashed border-stone-200 text-xs text-stone-400">
                                                No variant combinations generated yet. Click "Regenerate Matrix" or configure them in Tab 2.
                                            </div>
                                        ) : (
                                            <div className="border border-stone-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-stone-50 text-[10px] uppercase font-semibold text-stone-500 border-b border-stone-200 sticky top-0">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left">SKU</th>
                                                            <th className="px-3 py-2 text-left">Variables Combination</th>
                                                            <th className="px-3 py-2 text-left">Price Extra</th>
                                                            <th className="px-3 py-2 text-left w-28">Selling Price (₹)</th>
                                                            <th className="px-3 py-2 text-left w-24">MRP (₹)</th>
                                                            <th className="px-3 py-2 text-left w-20">Stock</th>
                                                            <th className="px-2 py-2 text-right w-10"/>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-stone-100">
                                                        {filteredVariants.map((v) => {
                                                            const realIdx = variantsList.findIndex((item) => item.sku === v.sku);
                                                            const extra = (v.option_ids || []).reduce(
                                                                (sum, optId) => sum + (Number(optionPriceDeltas[optId]) || 0),
                                                                0
                                                            );
                                                            return (
                                                                <tr key={v.sku} className="hover:bg-stone-50/60">
                                                                    <td className="px-3 py-2 font-mono font-medium text-stone-800 text-[11px]">
                                                                        {v.sku}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-stone-700">
                                                                        <span className="font-medium">{v.option_names}</span>
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        {extra > 0 ? (
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                                                                +₹{extra}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] text-stone-400">Standard</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="number"
                                                                            value={v.price}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                setVariantsList((prev) =>
                                                                                    prev.map((item, idx) =>
                                                                                        idx === realIdx ? { ...item, price: val } : item
                                                                                    )
                                                                                );
                                                                            }}
                                                                            className="w-full border border-stone-200 rounded-lg px-2 py-1 text-xs font-semibold text-stone-900 bg-white focus:outline-none focus:border-stone-900"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="number"
                                                                            value={v.compare_at_price || ''}
                                                                            placeholder={formComparePrice}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                setVariantsList((prev) =>
                                                                                    prev.map((item, idx) =>
                                                                                        idx === realIdx ? { ...item, compare_at_price: val } : item
                                                                                    )
                                                                                );
                                                                            }}
                                                                            className="w-full border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-600 bg-white focus:outline-none focus:border-stone-900"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="number"
                                                                            value={v.stock}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                setVariantsList((prev) =>
                                                                                    prev.map((item, idx) =>
                                                                                        idx === realIdx ? { ...item, stock: val } : item
                                                                                    )
                                                                                );
                                                                            }}
                                                                            className="w-full border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-900 bg-white focus:outline-none focus:border-stone-900"
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-2 text-right">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setVariantsList(variantsList.filter((_, idx) => idx !== realIdx))
                                                                            }
                                                                            className="text-stone-400 hover:text-red-600 cursor-pointer p-1"
                                                                            title="Remove this combination"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer Controls */}
                            <div className="pt-4 border-t border-stone-100 flex items-center justify-between shrink-0">
                                <div className="flex gap-2">
                                    {activeTab !== 'general' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const tabs = ['general', 'variants', 'images', 'pricing'];
                                                const prev = tabs[tabs.indexOf(activeTab) - 1];
                                                if (prev) setActiveTab(prev);
                                            }}
                                            className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 rounded-lg cursor-pointer"
                                        >
                                            ← Back
                                        </button>
                                    )}
                                    {activeTab !== 'pricing' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const tabs = ['general', 'variants', 'images', 'pricing'];
                                                const next = tabs[tabs.indexOf(activeTab) + 1];
                                                if (next) setActiveTab(next);
                                            }}
                                            className="px-3 py-1.5 text-xs text-stone-800 hover:text-black bg-stone-200 hover:bg-stone-300 font-medium rounded-lg cursor-pointer"
                                        >
                                            Next Step →
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-black rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                                    >
                                        {submitting
                                            ? 'Saving Product…'
                                            : editingProduct
                                            ? 'Save Changes'
                                            : 'Create Product'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Photo Preview Lightbox Modal */}
            {previewImageUrl && (
                <div
                    className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-2xl w-full p-4 overflow-hidden relative shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                            <span className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                                <Maximize2 className="w-3.5 h-3.5 text-stone-600" />
                                <span>Full Size Image Preview</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setPreviewImageUrl(null)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-2 flex items-center justify-center bg-stone-50 rounded-xl mt-3 max-h-[70vh] overflow-hidden">
                            <img
                                src={previewImageUrl}
                                alt="Product Preview"
                                className="max-w-full max-h-[65vh] object-contain rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
