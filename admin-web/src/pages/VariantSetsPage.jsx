import { useState, useEffect } from 'react';
import {
    fetchCategoryTree,
    listCategories,
    getCategorySpecifications,
    saveCategorySpecifications,
    createSpecGroup,
    createSpecOption,
    presetCategorySpecifications,
} from '../services/api';
import { Sparkles, Plus, Save, X, FolderTree, Check } from 'lucide-react';

export default function VariantSetsPage() {
    const [tree, setTree] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [selectedMainId, setSelectedMainId] = useState('');
    const [selectedSubId, setSelectedSubId] = useState('');
    const [loadingTree, setLoadingTree] = useState(true);

    // Specification groups and options data for the selected subcategory
    const [allGroups, setAllGroups] = useState([]);
    const [assignedGroups, setAssignedGroups] = useState([]); // Array of { group_id, is_required, sort_order, option_ids: [] }
    const [loadingSpecs, setLoadingSpecs] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // Modal state for creating a new group
    const [newGroupModal, setNewGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupCode, setNewGroupCode] = useState('');
    const [newGroupInputType, setNewGroupInputType] = useState('select');

    // Inline new option input tracking by groupId: { [groupId]: string }
    const [inlineOptionNames, setInlineOptionNames] = useState({});

    // 1. Load category tree on mount
    useEffect(() => {
        setLoadingTree(true);
        Promise.all([fetchCategoryTree(), listCategories({ limit: 100 })])
            .then(([treeRes, listRes]) => {
                const roots = treeRes.data || [];
                setTree(roots);
                setAllCategories(listRes.data || []);
                if (roots.length > 0) {
                    setSelectedMainId(String(roots[0].id));
                    // Pick first subcategory if available
                    const firstChild = roots[0].children?.[0];
                    if (firstChild) {
                        setSelectedSubId(String(firstChild.id));
                    }
                }
            })
            .catch((err) => {
                setFeedback({ type: 'error', message: err.message || 'Failed to load categories' });
            })
            .finally(() => setLoadingTree(false));
    }, []);

    // 2. When selected subcategory changes, load its variant specifications
    useEffect(() => {
        if (!selectedSubId) {
            setAssignedGroups([]);
            return;
        }

        setLoadingSpecs(true);
        setFeedback(null);
        getCategorySpecifications(selectedSubId)
            .then((res) => {
                const data = res.data || {};
                setAllGroups(data.all_groups || []);

                // Structure current assignments
                const currentAssigned = (data.assigned_groups || []).map((ag) => ({
                    group_id: ag.id,
                    is_required: ag.is_required !== false,
                    sort_order: ag.sort_order || 0,
                    option_ids: ag.assigned_option_ids || ag.options?.map((o) => o.id) || [],
                }));

                // If nothing is assigned yet, check if there are groups in all_groups
                setAssignedGroups(currentAssigned);
            })
            .catch((err) => {
                setFeedback({ type: 'error', message: err.message || 'Failed to load variant specifications' });
            })
            .finally(() => setLoadingSpecs(false));
    }, [selectedSubId]);

    // Handle Main Category Change
    function handleSelectMain(mainId) {
        setSelectedMainId(mainId);
        const root = tree.find((t) => String(t.id) === String(mainId));
        if (root && root.children?.length > 0) {
            // Find first subcategory (handling nested children if any)
            const firstChild = root.children[0];
            const targetSub = firstChild.children?.length > 0 ? firstChild.children[0] : firstChild;
            setSelectedSubId(String(targetSub.id));
        } else {
            setSelectedSubId('');
        }
    }

    // List of subcategories for currently selected main category
    const currentRoot = tree.find((t) => String(t.id) === String(selectedMainId));
    const subcategoryList = [];
    if (currentRoot?.children) {
        currentRoot.children.forEach((c) => {
            if (c.children?.length > 0) {
                c.children.forEach((grandChild) => {
                    subcategoryList.push({
                        ...grandChild,
                        displayName: `${c.name} · ${grandChild.name}`,
                    });
                });
            } else {
                subcategoryList.push({
                    ...c,
                    displayName: c.name,
                });
            }
        });
    }

    const selectedCategoryObject = allCategories.find((c) => String(c.id) === String(selectedSubId));

    // Toggle whether a group is active for this subcategory
    function toggleGroup(groupId) {
        const existing = assignedGroups.find((g) => g.group_id === groupId);
        if (existing) {
            setAssignedGroups(assignedGroups.filter((g) => g.group_id !== groupId));
        } else {
            // Find group in allGroups to initialize with all active options selected by default
            const groupDef = allGroups.find((g) => g.id === groupId);
            const defaultOptionIds = groupDef?.options?.map((o) => o.id) || [];
            setAssignedGroups([
                ...assignedGroups,
                {
                    group_id: groupId,
                    is_required: true,
                    sort_order: assignedGroups.length,
                    option_ids: defaultOptionIds,
                },
            ]);
        }
    }

    // Toggle an option inside an assigned group
    function toggleOption(groupId, optionId) {
        setAssignedGroups((prev) =>
            prev.map((g) => {
                if (g.group_id !== groupId) return g;
                const ids = g.option_ids || [];
                const nextIds = ids.includes(optionId)
                    ? ids.filter((id) => id !== optionId)
                    : [...ids, optionId];
                return { ...g, option_ids: nextIds };
            })
        );
    }

    // Toggle select all options in a group
    function toggleAllOptionsInGroup(group) {
        const assigned = assignedGroups.find((g) => g.group_id === group.id);
        if (!assigned) return;
        const allOptionIds = group.options?.map((o) => o.id) || [];
        const isAllSelected = allOptionIds.every((id) => assigned.option_ids?.includes(id));

        setAssignedGroups((prev) =>
            prev.map((g) => {
                if (g.group_id !== group.id) return g;
                return {
                    ...g,
                    option_ids: isAllSelected ? [] : allOptionIds,
                };
            })
        );
    }

    // Toggle required status of a group
    function toggleRequired(groupId) {
        setAssignedGroups((prev) =>
            prev.map((g) => {
                if (g.group_id !== groupId) return g;
                return { ...g, is_required: !g.is_required };
            })
        );
    }

    // Inline add a new option to a group (e.g. "Press Button", "Chinese Collar", "Mandarin")
    async function handleAddInlineOption(group) {
        const name = (inlineOptionNames[group.id] || '').trim();
        if (!name) return;

        try {
            const res = await createSpecOption({
                group_id: group.id,
                name,
            });
            const newOption = res.data;

            // Clear input
            setInlineOptionNames({ ...inlineOptionNames, [group.id]: '' });

            // Update allGroups state
            setAllGroups((prev) =>
                prev.map((g) => {
                    if (g.id !== group.id) return g;
                    return {
                        ...g,
                        options: [...(g.options || []), newOption],
                    };
                })
            );

            // Automatically check this newly created option for this subcategory
            setAssignedGroups((prev) => {
                const groupAssigned = prev.find((g) => g.group_id === group.id);
                if (!groupAssigned) {
                    return [
                        ...prev,
                        {
                            group_id: group.id,
                            is_required: true,
                            sort_order: prev.length,
                            option_ids: [newOption.id],
                        },
                    ];
                }
                return prev.map((g) => {
                    if (g.group_id !== group.id) return g;
                    return {
                        ...g,
                        option_ids: [...(g.option_ids || []), newOption.id],
                    };
                });
            });

            setFeedback({ type: 'success', message: `Added "${name}" to ${group.name}!` });
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Failed to add option' });
        }
    }

    // Create a new Variant Group (e.g. "Pocket Style", "Fabric Finish")
    async function handleCreateGroup(e) {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        try {
            const res = await createSpecGroup({
                name: newGroupName.trim(),
                code: newGroupCode.trim() || undefined,
                input_type: newGroupInputType,
                is_required: true,
            });
            const created = res.data;

            setAllGroups((prev) => [...prev, { ...created, options: [] }]);

            // Automatically enable this group
            setAssignedGroups((prev) => [
                ...prev,
                {
                    group_id: created.id,
                    is_required: true,
                    sort_order: prev.length,
                    option_ids: [],
                },
            ]);

            setNewGroupModal(false);
            setNewGroupName('');
            setNewGroupCode('');
            setFeedback({ type: 'success', message: `Variant Group "${created.name}" created!` });
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Failed to create group' });
        }
    }

    // Save Variant Set
    async function handleSave() {
        if (!selectedSubId) {
            setFeedback({ type: 'error', message: 'Please select a subcategory first' });
            return;
        }

        setSaving(true);
        setFeedback(null);
        try {
            await saveCategorySpecifications(selectedSubId, {
                groups: assignedGroups,
            });
            setFeedback({
                type: 'success',
                message: `Variant Set saved successfully for "${selectedCategoryObject?.name || 'Subcategory'}"!`,
            });
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Failed to save variant set' });
        } finally {
            setSaving(false);
        }
    }

    // 1-Click Auto Preset for standard apparel
    async function handleApplyPreset() {
        if (!selectedSubId) return;
        if (!window.confirm(`Populate standard apparel variant presets (Collar, Buttons, Sleeve, Fit, Size) for "${selectedCategoryObject?.name}"?`)) {
            return;
        }

        setSaving(true);
        setFeedback(null);
        try {
            const res = await presetCategorySpecifications(selectedSubId);
            const data = res.data || {};
            setAllGroups(data.all_groups || []);
            const updated = (data.assigned_groups || []).map((ag) => ({
                group_id: ag.id,
                is_required: ag.is_required !== false,
                sort_order: ag.sort_order || 0,
                option_ids: ag.assigned_option_ids || ag.options?.map((o) => o.id) || [],
            }));
            setAssignedGroups(updated);
            setFeedback({
                type: 'success',
                message: `Standard clothing variants configured for "${selectedCategoryObject?.name}"!`,
            });
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Preset failed' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
                <div>
                    <h1 className="text-xl font-serif text-stone-900 tracking-tight">
                        Category Variant Sets & Customizations
                    </h1>
                    <p className="text-xs text-stone-500 mt-1">
                        Select category → subcategory → configure variables (Chinese Collar, Normal Collar, Press Button, Sleeve, Size, etc.)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleApplyPreset}
                        disabled={saving || !selectedSubId}
                        className="px-3.5 py-2 text-xs font-medium text-[#8c6b2d] bg-[#fbf5ea] hover:bg-[#f6ebd5] border border-[#e8d8b9] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        title="Auto-configure Collar, Button, Sleeve, Fit, and Size variables"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto-Fill Standard Presets</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setNewGroupModal(true)}
                        className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Variant Group</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !selectedSubId}
                        className="px-5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-black rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                        <Save className="w-3.5 h-3.5" />
                        <span>{saving ? 'Saving…' : 'Save Variant Set'}</span>
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

            {/* Step 1 & 2: Category Hierarchy Navigation Card */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs space-y-4">
                {/* Step 1: Main Category Selection */}
                <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block mb-2">
                        Step 1 · Choose Main Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {loadingTree ? (
                            <span className="text-xs text-stone-400">Loading categories…</span>
                        ) : (
                            tree.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => handleSelectMain(cat.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                                        String(selectedMainId) === String(cat.id)
                                            ? 'bg-stone-900 text-white shadow-xs'
                                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80 hover:text-black'
                                    }`}
                                >
                                    <FolderTree className="w-3.5 h-3.5 text-stone-400" />
                                    <span>{cat.name}</span>
                                    <span className="text-[10px] opacity-70">
                                        ({cat.children?.length || 0})
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Step 2: Subcategory Selection */}
                <div className="pt-3 border-t border-stone-100">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block mb-2">
                        Step 2 · Select Subcategory (e.g. Shirt, Pant, Chudi, Lehenga)
                    </label>
                    {subcategoryList.length === 0 ? (
                        <p className="text-xs text-stone-400 italic">
                            No subcategories under this main category. Create subcategories in Categories page first.
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {subcategoryList.map((sub) => {
                                const isSelected = String(selectedSubId) === String(sub.id);
                                return (
                                    <button
                                        key={sub.id}
                                        type="button"
                                        onClick={() => setSelectedSubId(String(sub.id))}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                                            isSelected
                                                ? 'bg-[#c9a96e] text-white shadow-xs ring-2 ring-[#c9a96e]/30'
                                                : 'bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                                        }`}
                                    >
                                        <span>{sub.displayName}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Step 3: Variant Configuration Workspace */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                            <span>Step 3 · Configured Variables for:</span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-[#fbf5ea] text-[#8c6b2d] border border-[#e8d8b9] text-xs font-mono font-medium">
                                {currentRoot?.name || 'Main'} → {selectedCategoryObject?.name || 'Subcategory'}
                            </span>
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                            Toggle which groups & variables apply to this subcategory. You can also add custom options inline.
                        </p>
                    </div>
                    <span className="text-xs text-stone-400">
                        Active Groups: <strong>{assignedGroups.length}</strong> / {allGroups.length}
                    </span>
                </div>

                {loadingSpecs ? (
                    <div className="p-12 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
                        Loading variant variables…
                    </div>
                ) : allGroups.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
                        <p className="text-sm font-medium text-stone-700">No variant groups found</p>
                        <p className="text-xs text-stone-400 mt-1">
                            Click "Auto-Fill Standard Presets" or "New Variant Group" to get started.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {allGroups.map((group) => {
                            const assigned = assignedGroups.find((g) => g.group_id === group.id);
                            const isEnabled = Boolean(assigned);
                            const assignedOptionIds = assigned?.option_ids || [];
                            const options = group.options || [];

                            return (
                                <div
                                    key={group.id}
                                    className={`rounded-2xl border transition-all bg-white overflow-hidden shadow-2xs flex flex-col justify-between ${
                                        isEnabled
                                            ? 'border-stone-300 ring-1 ring-stone-900/5'
                                            : 'border-stone-200 opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    {/* Card Header */}
                                    <div className="p-4 bg-stone-50/70 border-b border-stone-100 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isEnabled}
                                                onChange={() => toggleGroup(group.id)}
                                                className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900 cursor-pointer"
                                                id={`group-${group.id}`}
                                            />
                                            <label
                                                htmlFor={`group-${group.id}`}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm text-stone-900">
                                                        {group.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-stone-400">
                                                        #{group.code}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-stone-500 block">
                                                    Type: {group.input_type} · {options.length} available variables
                                                </span>
                                            </label>
                                        </div>

                                        {isEnabled && (
                                            <div className="flex items-center gap-2">
                                                <label className="text-[11px] font-medium text-stone-600 flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={assigned.is_required}
                                                        onChange={() => toggleRequired(group.id)}
                                                        className="w-3.5 h-3.5 rounded text-stone-900 cursor-pointer"
                                                    />
                                                    <span>Required</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAllOptionsInGroup(group)}
                                                    className="px-2 py-0.5 text-[10px] text-stone-500 hover:text-stone-900 bg-stone-200/60 hover:bg-stone-200 rounded cursor-pointer"
                                                >
                                                    Select All
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Body: Options & Variables */}
                                    <div className="p-4 flex-1 space-y-3">
                                        {options.length === 0 ? (
                                            <p className="text-xs text-stone-400 italic">
                                                No variables defined in this group yet. Add one below!
                                            </p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {options.map((opt) => {
                                                    const isChecked = assignedOptionIds.includes(opt.id);
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            disabled={!isEnabled}
                                                            onClick={() => toggleOption(group.id, opt.id)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                                                !isEnabled
                                                                    ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                                                                    : isChecked
                                                                    ? 'bg-stone-900 text-white shadow-2xs'
                                                                    : 'bg-stone-50 text-stone-700 border border-stone-200 hover:border-stone-300 hover:bg-stone-100'
                                                            }`}
                                                        >
                                                            {isChecked ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                                            <span>{opt.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Inline Add Option to this group */}
                                        {isEnabled && (
                                            <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder={`+ Add new variable to ${group.name} (e.g. Chinese Collar, Press Button)…`}
                                                    value={inlineOptionNames[group.id] || ''}
                                                    onChange={(e) =>
                                                        setInlineOptionNames({
                                                            ...inlineOptionNames,
                                                            [group.id]: e.target.value,
                                                        })
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddInlineOption(group);
                                                        }
                                                    }}
                                                    className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddInlineOption(group)}
                                                    className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Floating / Bottom Sticky Save Bar */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur border border-stone-200/90 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                <div className="text-xs text-stone-600">
                    Ready to save variant variables for{' '}
                    <strong className="text-stone-900">
                        {currentRoot?.name} → {selectedCategoryObject?.name}
                    </strong>{' '}
                    ({assignedGroups.length} groups enabled).
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !selectedSubId}
                        className="px-6 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-black rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                        {saving ? 'Saving Variant Set…' : 'Save Variant Set'}
                    </button>
                </div>
            </div>

            {/* Modal: Create New Variant Group */}
            {newGroupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                            <h2 className="text-base font-serif text-stone-900">New Variant Group</h2>
                            <button
                                type="button"
                                onClick={() => setNewGroupModal(false)}
                                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                    Group Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Pocket Style, Collar Style, Button Type"
                                    value={newGroupName}
                                    onChange={(e) => {
                                        setNewGroupName(e.target.value);
                                        if (!newGroupCode) {
                                            setNewGroupCode(
                                                e.target.value
                                                    .toLowerCase()
                                                    .replace(/[^\w\s-]/g, '')
                                                    .replace(/[\s-]+/g, '_')
                                            );
                                        }
                                    }}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                    System Code
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. pocket, collar_style, button_type"
                                    value={newGroupCode}
                                    onChange={(e) => setNewGroupCode(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                    Input Type
                                </label>
                                <select
                                    value={newGroupInputType}
                                    onChange={(e) => setNewGroupInputType(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-900"
                                >
                                    <option value="select">Dropdown / Select (e.g. Collar, Buttons, Sleeve)</option>
                                    <option value="swatch">Color Swatch (e.g. Fabric Color)</option>
                                    <option value="text">Custom Text</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setNewGroupModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-black rounded-xl transition-colors cursor-pointer"
                                >
                                    Create Group
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

