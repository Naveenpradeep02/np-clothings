import { clientEnv } from '../config/env';
export class ApiError extends Error {
    status;
    code;
    details;
    constructor(message, status, code, details) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
let getToken = async () => null;
export function setTokenGetter(fn) {
    getToken = fn;
}
async function request(path, init) {
    const base = clientEnv.apiBaseUrl.replace(/\/$/, '');
    const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
    const token = await getToken();
    const headers = {
        Accept: 'application/json',
        ...init?.headers,
    };
    if (token)
        headers.Authorization = `Bearer ${token}`;
    if (init?.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, { ...init, headers });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new ApiError(body?.error?.message || res.statusText || 'Request failed', res.status, body?.error?.code, body?.error?.details);
    }
    return body;
}
export async function getMe() {
    const res = await request('/auth/me');
    const u = res.data.user;
    return {
        success: true,
        data: {
            ...u,
            display_name: u.profile?.display_name,
            permissions: u.permissions || [],
            roles: u.roles || [],
        },
    };
}
export async function loginAdmin(email, password, role) {
    return request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
    });
}
export async function getOverview(params = {}) {
    const qs = new URLSearchParams();
    if (params.from)
        qs.set('from', params.from);
    if (params.to)
        qs.set('to', params.to);
    const q = qs.toString();
    return request(`/analytics/overview${q ? `?${q}` : ''}`);
}
export async function listOrders(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '')
            qs.set(k, String(v));
    });
    const q = qs.toString();
    return request(`/orders${q ? `?${q}` : ''}`);
}
export async function getOrder(id) {
    return request(`/orders/${id}`);
}
export async function transitionOrder(id, status, note) {
    return request(`/orders/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, note }),
    });
}
export async function listProducts(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '')
            qs.set(k, String(v));
    });
    const q = qs.toString();
    return request(`/products${q ? `?${q}` : ''}`);
}
export async function getProduct(id) {
    return request(`/products/${id}`);
}
export async function createProduct(body) {
    return request('/products', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
export async function updateProduct(id, body) {
    return request(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}
export async function deleteProduct(id) {
    return request(`/products/${id}`, {
        method: 'DELETE',
    });
}
export async function addProductImage(productId, body) {
    return request(`/products/${productId}/images`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
export async function removeProductImage(productId, imageId) {
    return request(`/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
    });
}
export async function updateProductImage(productId, imageId, body) {
    return request(`/products/${productId}/images/${imageId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}

export async function assignProductGroups(productId, groups) {
    return request(`/products/${productId}/specification-groups`, {
        method: 'PUT',
        body: JSON.stringify({ groups }),
    });
}
export async function assignProductOptions(productId, option_ids) {
    return request(`/products/${productId}/specification-options`, {
        method: 'PUT',
        body: JSON.stringify({ option_ids }),
    });
}
export async function listProductVariants(productId) {
    return request(`/variants/product/${productId}`);
}
export async function createVariant(body) {
    return request('/variants', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
export async function updateVariant(id, body) {
    return request(`/variants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}
export async function deleteVariant(id) {
    return request(`/variants/${id}`, {
        method: 'DELETE',
    });
}
export async function adjustInventory(body) {
    return request(`/inventory/variants/${body.variant_id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({
            quantity_delta: body.quantity_delta,
            reason: body.reason,
        }),
    });
}
export async function listCmsSections(page = 'home') {
    return request(`/cms/admin/sections?page=${encodeURIComponent(page)}`);
}
export async function updateCmsSection(id, body) {
    return request(`/cms/admin/sections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}
export async function seedCmsHome() {
    return request('/cms/admin/seed-home', { method: 'POST' });
}
export async function listCustomers(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '')
            qs.set(k, String(v));
    });
    const q = qs.toString();
    return request(`/users${q ? `?${q}` : ''}`);
}
export async function getCustomer(id) {
    return request(`/users/${id}`);
}
export async function updateCustomerStatus(id, status, reason) {
    return request(`/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
    });
}
export async function listCoupons(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v)
            qs.set(k, v);
    });
    const q = qs.toString();
    return request(`/coupons${q ? `?${q}` : ''}`);
}
export async function getOrderShipments(orderId) {
    return request(`/shipping/order/${orderId}`);
}
export async function createOrderShipment(body) {
    return request('/shipping', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
export async function listReturns(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '')
            qs.set(k, String(v));
    });
    const q = qs.toString();
    return request(`/returns${q ? `?${q}` : ''}`);
}
export async function transitionReturn(id, status, note) {
    return request(`/returns/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, note }),
    });
}
export async function refundReturn(id, amount, reason) {
    return request(`/returns/${id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
    });
}
export async function listSupportTickets(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '')
            qs.set(k, String(v));
    });
    const q = qs.toString();
    return request(`/support${q ? `?${q}` : ''}`);
}
export async function getSupportTicket(id) {
    return request(`/support/${id}`);
}
export async function replySupportTicket(id, body, isInternal = false) {
    return request(`/support/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body, is_internal: isInternal }),
    });
}
export async function updateSupportTicket(id, status) {
    return request(`/support/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}
// Categories API
export async function listCategories(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    const q = qs.toString();
    return request(`/catalog/categories${q ? `?${q}` : ''}`);
}
export async function fetchCategoryTree() {
    return request('/catalog/categories/tree');
}
export async function createCategory(body) {
    return request('/catalog/categories', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
export async function updateCategory(id, body) {
    return request(`/catalog/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}
export async function deleteCategory(id) {
    return request(`/catalog/categories/${id}`, {
        method: 'DELETE',
    });
}

// Brands API
export async function listBrands(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    const q = qs.toString();
    return request(`/catalog/brands${q ? `?${q}` : ''}`);
}
export async function createBrand(body) {
    return request('/catalog/brands', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
export async function updateBrand(id, body) {
    return request(`/catalog/brands/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}
export async function deleteBrand(id) {
    return request(`/catalog/brands/${id}`, {
        method: 'DELETE',
    });
}

// Upload API
export async function uploadImage(fileOrBase64, folder = 'general', filename = '') {
    let base64 = fileOrBase64;
    let name = filename;

    if (fileOrBase64 instanceof File) {
        name = fileOrBase64.name;
        base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(fileOrBase64);
        });
    }

    return request('/uploads', {
        method: 'POST',
        body: JSON.stringify({ image: base64, folder, filename: name }),
    });
}

// Specifications & Variant Sets API
export async function listSpecGroups() {
    return request('/specifications/groups');
}
export async function createSpecGroup(body) {
    return request('/specifications/groups', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
export async function updateSpecGroup(id, body) {
    return request(`/specifications/groups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}
export async function listSpecOptions(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    const q = qs.toString();
    return request(`/specifications/options${q ? `?${q}` : ''}`);
}
export async function createSpecOption(body) {
    return request('/specifications/options', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
export async function getCategorySpecifications(categoryId) {
    return request(`/specifications/categories/${categoryId}`);
}
export async function saveCategorySpecifications(categoryId, body) {
    return request(`/specifications/categories/${categoryId}`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
export async function presetCategorySpecifications(categoryId, body = {}) {
    return request(`/specifications/categories/${categoryId}/preset`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export default { request, setTokenGetter };
