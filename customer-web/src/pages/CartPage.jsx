import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { Check } from 'lucide-react';
import { fetchCart, updateCartItem, removeCartItem, checkoutOrder, listAddresses, } from '../services/api';
const emptyAddress = {
    full_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country_code: 'IN',
};
export default function CartPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [cart, setCart] = useState(null);
    const [coupon, setCoupon] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Checkout states
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('new');
    const [newAddress, setNewAddress] = useState(emptyAddress);
    const [customerNote, setCustomerNote] = useState('');
    const [placingOrder, setPlacingOrder] = useState(false);
    const [checkoutError, setCheckoutError] = useState(null);
    function load(code) {
        setLoading(true);
        fetchCart(code || appliedCoupon || undefined)
            .then((res) => setCart(res.data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }
    useEffect(() => {
        load();
    }, []);
    // Fetch saved addresses if user is logged in
    useEffect(() => {
        if (user) {
            listAddresses()
                .then((res) => {
                const list = res.data || [];
                setSavedAddresses(list);
                if (list.length > 0) {
                    const def = list.find((a) => a.is_default) || list[0];
                    setSelectedAddressId(def.id);
                }
                else {
                    setSelectedAddressId('new');
                }
            })
                .catch(() => { });
        }
    }, [user]);
    async function changeQty(itemId, quantity) {
        try {
            const res = await updateCartItem(itemId, quantity);
            setCart(res.data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        }
    }
    async function remove(itemId) {
        try {
            const res = await removeCartItem(itemId);
            setCart(res.data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Remove failed');
        }
    }
    function applyCoupon() {
        setAppliedCoupon(coupon.trim().toUpperCase());
        load(coupon.trim().toUpperCase());
    }
    async function handlePlaceOrder(e) {
        e.preventDefault();
        if (!cart || !user)
            return;
        setPlacingOrder(true);
        setCheckoutError(null);
        let shippingAddress;
        if (selectedAddressId === 'new') {
            if (!newAddress.full_name || !newAddress.line1 || !newAddress.city || !newAddress.postal_code) {
                setCheckoutError('Please fill in all required shipping address fields.');
                setPlacingOrder(false);
                return;
            }
            shippingAddress = newAddress;
        }
        else {
            const matched = savedAddresses.find((a) => a.id === selectedAddressId);
            if (!matched) {
                setCheckoutError('Please select a valid shipping address.');
                setPlacingOrder(false);
                return;
            }
            shippingAddress = {
                full_name: matched.full_name,
                phone: matched.phone,
                line1: matched.line1,
                line2: matched.line2,
                city: matched.city,
                state: matched.state,
                postal_code: matched.postal_code,
                country_code: matched.country_code || 'IN',
            };
        }
        try {
            const res = await checkoutOrder({
                cart_id: cart.id,
                shipping_address: shippingAddress,
                coupon_code: appliedCoupon || undefined,
                customer_note: customerNote.trim() || undefined,
            });
            // Navigate to order detail page on success
            navigate(`/account/orders/${res.data.id}`);
        }
        catch (err) {
            setCheckoutError(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
        }
        finally {
            setPlacingOrder(false);
        }
    }
    const t = cart?.totals;
    return (<Layout cartCount={cart?.item_count}>
      <Seo title="Shopping Cart & Checkout — NP Clothings" noindex/>
      <div className="mx-auto max-w-6xl w-full px-6 py-10">
        <h1 className="text-3xl font-light tracking-wide mb-8">Shopping Cart</h1>
        {loading && <p className="text-sm text-neutral-400">Loading your selections…</p>}
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {cart && !loading && cart.items.length === 0 && (<div className="text-center py-20 bg-white border border-stone-200 rounded-2xl">
            <p className="text-lg font-light text-neutral-600 mb-2">Your cart is empty</p>
            <p className="text-xs text-neutral-400 mb-6">Explore our curated collection of quiet luxury pieces.</p>
            <Link to="/shop" className="inline-block text-xs tracking-widest uppercase border border-neutral-900 px-8 py-3.5 hover:bg-neutral-900 hover:text-white transition">
              Browse Shop
            </Link>
          </div>)}

        {cart && cart.items.length > 0 && (<div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-neutral-200 rounded-xl p-6 divide-y divide-neutral-100">
                {cart.items.map((item) => (<div key={item.cart_item_id} className="flex flex-col sm:flex-row gap-4 py-6 first:pt-0 last:pb-0">
                    <div className="flex-1">
                      <p className="text-base font-light tracking-wide text-neutral-900">{item.product_name}</p>
                      <p className="text-xs text-neutral-400 mt-1">SKU {item.sku}</p>
                      {!item.in_stock && (<p className="text-xs text-amber-700 mt-1 font-medium">Limited stock available</p>)}
                      <div className="flex items-center gap-3 mt-4">
                        <button type="button" className="w-8 h-8 rounded border border-neutral-300 text-sm hover:border-neutral-900 transition flex items-center justify-center" onClick={() => changeQty(item.cart_item_id, item.quantity - 1)}>
                          −
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button type="button" className="w-8 h-8 rounded border border-neutral-300 text-sm hover:border-neutral-900 transition flex items-center justify-center" onClick={() => changeQty(item.cart_item_id, item.quantity + 1)}>
                          +
                        </button>
                        <button type="button" className="text-xs text-neutral-400 hover:text-red-600 underline ml-4 transition-colors" onClick={() => remove(item.cart_item_id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right sm:self-center">
                      <p className="text-base font-medium">₹{item.line_total.toLocaleString('en-IN')}</p>
                      {item.quantity > 1 && (<p className="text-xs text-neutral-400">₹{item.unit_price.toLocaleString('en-IN')} each</p>)}
                    </div>
                  </div>))}
              </div>

              {/* Checkout shipping address block if user clicked proceed to checkout */}
              {isCheckingOut && (<div className="bg-white border border-neutral-200 rounded-xl p-6 animate-fadeIn">
                  <h2 className="text-lg font-light tracking-wide mb-4">Shipping Destination</h2>
                  {checkoutError && (<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                      {checkoutError}
                    </div>)}

                  <form onSubmit={handlePlaceOrder} className="space-y-4">
                    {savedAddresses.length > 0 && (<div className="space-y-3 mb-6">
                        <p className="text-xs uppercase tracking-widest text-neutral-400">Select Saved Address</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {savedAddresses.map((addr) => (<label key={addr.id} className={`p-3.5 border rounded-lg cursor-pointer block transition ${selectedAddressId === addr.id
                            ? 'border-neutral-900 bg-neutral-50'
                            : 'border-neutral-200 hover:border-neutral-400'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <input type="radio" name="selected_address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)}/>
                                <span className="text-xs font-semibold text-neutral-800">{addr.full_name}</span>
                              </div>
                              <p className="text-xs text-neutral-500 pl-5">
                                {addr.line1}, {addr.city}, {addr.state} - {addr.postal_code}
                              </p>
                              {addr.phone && (<p className="text-xs text-neutral-400 pl-5 mt-0.5">Phone: {addr.phone}</p>)}
                            </label>))}
                          <label className={`p-3.5 border rounded-lg cursor-pointer block transition ${selectedAddressId === 'new'
                        ? 'border-neutral-900 bg-neutral-50'
                        : 'border-neutral-200 hover:border-neutral-400'}`}>
                            <div className="flex items-center gap-2">
                              <input type="radio" name="selected_address" checked={selectedAddressId === 'new'} onChange={() => setSelectedAddressId('new')}/>
                              <span className="text-xs font-semibold text-neutral-800">+ New Address</span>
                            </div>
                          </label>
                        </div>
                      </div>)}

                    {(selectedAddressId === 'new' || savedAddresses.length === 0) && (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-neutral-500 block mb-1">Full Name *</label>
                          <input type="text" required value={newAddress.full_name} onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })} className="w-full border border-neutral-300 rounded px-3 py-2 text-xs" placeholder="Recipient name"/>
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500 block mb-1">Phone Number</label>
                          <input type="tel" value={newAddress.phone || ''} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="w-full border border-neutral-300 rounded px-3 py-2 text-xs" placeholder="+91 98765 43210"/>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs text-neutral-500 block mb-1">Street Address *</label>
                          <input type="text" required value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} className="w-full border border-neutral-300 rounded px-3 py-2 text-xs" placeholder="Flat / Building, Street"/>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs text-neutral-500 block mb-1">Apartment / Suite (Optional)</label>
                          <input type="text" value={newAddress.line2 || ''} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} className="w-full border border-neutral-300 rounded px-3 py-2 text-xs" placeholder="Unit, Floor, Landmark"/>
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500 block mb-1">City *</label>
                          <input type="text" required value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full border border-neutral-300 rounded px-3 py-2 text-xs" placeholder="City"/>
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500 block mb-1">State / Province *</label>
                          <input type="text" required value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="w-full border border-neutral-300 rounded px-3 py-2 text-xs" placeholder="State"/>
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500 block mb-1">PIN / Postal Code *</label>
                          <input type="text" required value={newAddress.postal_code} onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })} className="w-full border border-neutral-300 rounded px-3 py-2 text-xs" placeholder="Postal code"/>
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500 block mb-1">Country</label>
                          <input type="text" disabled value="India (IN)" className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-2 text-xs text-neutral-500"/>
                        </div>
                      </div>)}

                    <div className="pt-2">
                      <label className="text-xs text-neutral-500 block mb-1">Order Notes (Optional)</label>
                      <textarea rows={2} value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} placeholder="Special delivery instructions or notes" className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"/>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button type="submit" disabled={placingOrder} className="flex-1 bg-neutral-900 text-white text-xs tracking-widest uppercase py-3.5 px-6 rounded hover:bg-neutral-800 disabled:opacity-50 transition">
                        {placingOrder ? 'Confirming Order…' : 'Place Order Now'}
                      </button>
                      <button type="button" onClick={() => setIsCheckingOut(false)} className="px-6 py-3.5 text-xs text-neutral-500 hover:text-neutral-900 transition">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>)}
            </div>

            {/* Summary Box */}
            <div className="border border-neutral-200 bg-white p-6 rounded-xl h-fit space-y-4">
              <p className="text-xs tracking-widest uppercase text-neutral-400">Order Summary</p>
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{t?.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {t && t.discount_amount > 0 && (<div className="flex justify-between text-sm text-emerald-700">
                  <span>Discount</span>
                  <span>−₹{t.discount_amount.toLocaleString('en-IN')}</span>
                </div>)}
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>₹{t?.tax_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>
                  {t?.shipping_amount === 0 ? 'Free' : `₹${t?.shipping_amount.toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="flex justify-between text-base pt-3 border-t border-neutral-100 font-medium">
                <span>Total</span>
                <span>₹{t?.grand_total.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-2">
                <div className="flex gap-2">
                  <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" className="flex-1 border border-neutral-200 px-3 py-2 text-xs uppercase"/>
                  <button type="button" onClick={applyCoupon} className="text-xs tracking-widest uppercase border border-neutral-900 px-4 py-2 hover:bg-neutral-900 hover:text-white transition">
                    Apply
                  </button>
                </div>
                {cart.coupon?.error && (<p className="text-xs text-red-600 mt-2">{cart.coupon.error}</p>)}
                {cart.coupon?.code && (
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Coupon {cart.coupon.code} applied!</span>
                  </p>
                )}
              </div>

              {!isCheckingOut && (<div className="pt-4 space-y-3">
                  {user ? (<button type="button" onClick={() => setIsCheckingOut(true)} className="w-full text-center text-xs tracking-widest uppercase py-4 bg-neutral-900 text-white hover:bg-neutral-800 transition rounded">
                      Proceed to Checkout
                    </button>) : (<Link to="/login" state={{ from: '/cart' }} className="block text-center text-xs tracking-widest uppercase py-4 bg-neutral-900 text-white hover:bg-neutral-800 transition rounded">
                      Sign In to Checkout
                    </Link>)}
                  <Link to="/shop" className="block text-center text-xs tracking-widest uppercase py-3 border border-neutral-300 hover:border-neutral-900 transition rounded">
                    Continue Shopping
                  </Link>
                </div>)}
            </div>
          </div>)}
      </div>
    </Layout>);
}
