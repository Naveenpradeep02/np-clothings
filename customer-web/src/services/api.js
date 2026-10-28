import { clientEnv } from '../config/env';
export class ApiError extends Error {
    status;
    code;
    constructor(message, status, code) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }
}
let getAuthToken = async () => null;
export function setTokenGetter(fn) {
    getAuthToken = fn;
}
async function request(path, init) {
    const base = clientEnv.apiBaseUrl.replace(/\/$/, '');
    const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
    const token = await getAuthToken();
    const headers = {
        Accept: 'application/json',
        ...init?.headers,
    };
    if (token)
        headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, {
        ...init,
        headers,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new ApiError(body?.error?.message || res.statusText, res.status, body?.error?.code);
    }
    return body;
}
export async function checkApiHealth(deep = false) {
    const origin = clientEnv.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    return request(`${origin}/health${deep ? '?deep=true' : ''}`);
}
export async function fetchHomePage() {
    return request('/cms/pages/home');
}
export async function fetchStorefrontProducts(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '')
            qs.set(k, String(v));
    });
    const q = qs.toString();
    return request(`/storefront/products${q ? `?${q}` : ''}`);
}
export async function fetchFacets() {
    return request('/storefront/facets');
}
export async function fetchCategoryTree() {
    return request('/catalog/categories/tree');
}
export async function fetchProduct(idOrSlug) {
    return request(`/products/${idOrSlug}`);
}
export async function resolveVariant(productId, optionIds) {
    return request('/variants/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, option_ids: optionIds }),
    });
}
export async function fetchProductVariants(productId) {
    return request(`/variants/product/${productId}`);
}
function sessionHeaders() {
    let sid = localStorage.getItem('aurea_session_id');
    if (!sid) {
        sid = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
        localStorage.setItem('aurea_session_id', sid);
    }
    return { 'X-Session-Id': sid };
}
export async function fetchCart(coupon) {
    const q = coupon ? `?coupon=${encodeURIComponent(coupon)}` : '';
    return request(`/carts${q}`, {
        headers: sessionHeaders(),
    });
}
export async function addToCart(variantId, quantity = 1) {
    return request('/carts/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...sessionHeaders() },
        body: JSON.stringify({ variant_id: variantId, quantity }),
    });
}
export async function updateCartItem(itemId, quantity) {
    return request(`/carts/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...sessionHeaders() },
        body: JSON.stringify({ quantity }),
    });
}
export async function removeCartItem(itemId) {
    return request(`/carts/items/${itemId}`, {
        method: 'DELETE',
        headers: sessionHeaders(),
    });
}
export async function getMe() {
    return request('/auth/me');
}
export async function loginUser(email, password) {
    return request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
}
export async function registerUser(payload) {
    return request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}
export async function updateProfile(body) {
    return request('/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}
export async function listMyOrders() {
    return request('/orders/mine');
}
export async function getOrder(id) {
    return request(`/orders/${id}`);
}
export async function listAddresses() {
    return request('/users/me/addresses');
}
export async function createAddress(body) {
    return request('/users/me/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}
export async function deleteAddress(id) {
    return request(`/users/me/addresses/${id}`, {
        method: 'DELETE',
    });
}
export async function listWishlist() {
    return request('/wishlist');
}
export async function addToWishlist(productId, variantId) {
    return request('/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, variant_id: variantId }),
    });
}
export async function removeFromWishlist(id) {
    return request(`/wishlist/${id}`, {
        method: 'DELETE',
    });
}
export async function checkoutOrder(payload) {
    return request('/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}
export async function trackEvent(eventType, metadata = {}) {
    try {
        return await request('/analytics/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...sessionHeaders() },
            body: JSON.stringify({ event_type: eventType, metadata }),
        });
    }
    catch {
        // Non-blocking for UI
    }
}
export async function fetchProductReviews(productId) {
    return request(`/reviews/product/${productId}`);
}
export async function fetchProductRecommendations(productId) {
    return request(`/reviews/product/${productId}/recommendations`);
}
export async function submitProductReview(body) {
    return request('/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}
export async function getOrderShipments(orderId) {
    return request(`/shipping/order/${orderId}`);
}
export async function getTracking(trackingNumber) {
    return request(`/shipping/track/${trackingNumber}`);
}
export async function createReturnRequest(body) {
    return request('/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}
export async function createSupportTicket(body) {
    return request('/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}
