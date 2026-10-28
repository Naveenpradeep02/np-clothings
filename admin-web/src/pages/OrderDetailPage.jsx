import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder, transitionOrder, getOrderShipments, createOrderShipment, ApiError, } from '../services/api';
import { RequirePermission } from '../components/RequireAuth';
import { useAuth } from '../auth/AuthContext';
import { StatusBadge } from './OrdersPage';
export default function OrderDetailPage() {
    return (<RequirePermission permission="orders:read">
      <OrderDetailInner />
    </RequirePermission>);
}
function OrderDetailInner() {
    const { id } = useParams();
    const { hasPermission } = useAuth();
    const [order, setOrder] = useState(null);
    const [shipments, setShipments] = useState([]);
    const [error, setError] = useState(null);
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    // Shipment dispatch form
    const [courierName, setCourierName] = useState('Delhivery');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');
    const [shipmentStatus, setShipmentStatus] = useState('label_created');
    const [shipmentNote, setShipmentNote] = useState('');
    const [registerProvider, setRegisterProvider] = useState(false);
    const [shippingBusy, setShippingBusy] = useState(false);
    const [shippingSuccess, setShippingSuccess] = useState(null);
    const load = () => {
        if (!id)
            return;
        getOrder(id)
            .then((res) => {
            setOrder(res.data);
            getOrderShipments(id)
                .then((sRes) => setShipments(sRes.data || []))
                .catch(() => { });
        })
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load order'));
    };
    useEffect(load, [id]);
    async function onTransition(e, status) {
        e.preventDefault();
        if (!id)
            return;
        setBusy(true);
        setError(null);
        try {
            const res = await transitionOrder(id, status, note || undefined);
            setOrder(res.data);
            setNote('');
            load();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Transition failed');
        }
        finally {
            setBusy(false);
        }
    }
    async function onDispatchShipment(e) {
        e.preventDefault();
        if (!id || !courierName)
            return;
        setShippingBusy(true);
        setShippingSuccess(null);
        setError(null);
        try {
            await createOrderShipment({
                order_id: Number(id),
                courier_name: courierName,
                tracking_number: trackingNumber.trim() || undefined,
                tracking_url: trackingUrl.trim() || undefined,
                status: shipmentStatus,
                register_with_provider: registerProvider,
                note: shipmentNote.trim() || undefined,
            });
            setShippingSuccess('Shipment created & customer tracking page updated!');
            setTrackingNumber('');
            setTrackingUrl('');
            setShipmentNote('');
            load();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to dispatch shipment');
        }
        finally {
            setShippingBusy(false);
        }
    }
    if (!order && !error)
        return <p className="text-stone-400 text-sm">Loading order…</p>;
    const next = order?.allowed_next_statuses || [];
    const items = order?.items || [];
    const shippingAddr = order?.shipping_address || {};
    return (<div className="max-w-4xl space-y-6">
      <div>
        <Link to="/orders" className="text-xs text-stone-500 hover:text-stone-800">
          ← Back to Orders
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium">{String(order?.order_number || '')}</h1>
            {order?.status ? <StatusBadge status={String(order.status)}/> : null}
          </div>
          <span className="text-xs text-stone-400">
            {order?.created_at ? new Date(String(order.created_at)).toLocaleString() : '—'}
          </span>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
      {shippingSuccess && (<p className="text-emerald-700 text-sm bg-emerald-50 p-3 rounded-lg">{shippingSuccess}</p>)}

      {/* Pricing & Customer Summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5 text-sm space-y-1">
          <h2 className="text-xs uppercase tracking-wider text-stone-400 font-medium mb-2">Order Totals</h2>
          <div className="flex justify-between">
            <span className="text-stone-500">Subtotal:</span>
            <span>₹{Number(order?.subtotal || 0).toLocaleString('en-IN')}</span>
          </div>
          {Number(order?.discount_amount || 0) > 0 && (<div className="flex justify-between text-emerald-700">
              <span>Discount ({String(order?.coupon_code || 'Promo')}):</span>
              <span>−₹{Number(order?.discount_amount).toLocaleString('en-IN')}</span>
            </div>)}
          <div className="flex justify-between">
            <span className="text-stone-500">Tax / GST:</span>
            <span>₹{Number(order?.tax_amount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Shipping:</span>
            <span>₹{Number(order?.shipping_amount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-stone-100 font-medium text-base">
            <span>Grand Total:</span>
            <span>₹{Number(order?.grand_total || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 text-sm">
          <h2 className="text-xs uppercase tracking-wider text-stone-400 font-medium mb-2">Delivery Destination</h2>
          <p className="font-medium text-stone-900">{shippingAddr.full_name || '—'}</p>
          <p className="text-stone-600 text-xs mt-1">{shippingAddr.line1}</p>
          {shippingAddr.line2 && <p className="text-stone-600 text-xs">{shippingAddr.line2}</p>}
          <p className="text-stone-600 text-xs">
            {shippingAddr.city}, {shippingAddr.state} {shippingAddr.postal_code}
          </p>
          {shippingAddr.phone && (<p className="text-stone-400 text-xs mt-2">Contact: {shippingAddr.phone}</p>)}
        </div>
      </div>

      {/* Order Items Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-stone-50 border-b border-stone-100">
          <h2 className="text-xs uppercase tracking-wider text-stone-500 font-medium">Purchased Items</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-stone-50/50 text-xs text-stone-500 text-left">
            <tr>
              <th className="px-5 py-2.5">Item & Specs</th>
              <th className="px-4 py-2.5">SKU</th>
              <th className="px-4 py-2.5">Qty</th>
              <th className="px-5 py-2.5 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((it) => (<tr key={String(it.id)}>
                <td className="px-5 py-3">
                  <p className="font-medium text-stone-900">{String(it.product_name)}</p>
                  {Array.isArray(it.selected_options) && it.selected_options.length > 0 && (<div className="flex flex-wrap gap-1 mt-1">
                      {it.selected_options.map((opt, i) => (<span key={i} className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                          {String(opt.group_name || opt.name)}: {String(opt.option_name || opt.value || '')}
                        </span>))}
                    </div>)}
                </td>
                <td className="px-4 py-3 text-stone-500 font-mono text-xs">{String(it.sku)}</td>
                <td className="px-4 py-3">{String(it.quantity)}</td>
                <td className="px-5 py-3 text-right font-medium">₹{Number(it.line_total || 0).toLocaleString('en-IN')}</td>
              </tr>))}
          </tbody>
        </table>
      </div>

      {/* Shipment & Courier Dispatch (Requirement #8: Manual + Auto Tracking) */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-medium">Courier & Tracking Dispatch</h2>
            <p className="text-xs text-stone-400">Manual tracking entry or automatic TrackingMore courier sync</p>
          </div>
        </div>

        {shipments.length > 0 && (<div className="space-y-3 mb-4">
            {shipments.map((s, idx) => (<div key={idx} className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-stone-800">{String(s.courier_name)}</span>
                  <span className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded capitalize">{String(s.status)}</span>
                </div>
                <p className="text-stone-500">Waybill / Tracking: {String(s.tracking_number || 'N/A')}</p>
                {Boolean(s.tracking_url) && (<a href={String(s.tracking_url)} target="_blank" rel="noreferrer" className="text-stone-900 underline block">
                    View Carrier Tracking ↗
                  </a>)}
              </div>))}
          </div>)}

        {hasPermission('orders:update_status') && (<form onSubmit={onDispatchShipment} className="pt-3 border-t border-stone-100 space-y-3 text-xs">
            <h3 className="font-medium text-stone-700">Dispatch / Update Shipment</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-500 mb-1">Courier Partner *</label>
                <select value={courierName} onChange={(e) => setCourierName(e.target.value)} className="w-full border border-stone-200 rounded-lg p-2 bg-white">
                  <option value="Delhivery">Delhivery</option>
                  <option value="BlueDart">Blue Dart</option>
                  <option value="DTDC">DTDC Express</option>
                  <option value="Shadowfax">Shadowfax</option>
                  <option value="DHL">DHL Express</option>
                  <option value="FedEx">FedEx</option>
                  <option value="Custom">Other Carrier</option>
                </select>
              </div>
              <div>
                <label className="block text-stone-500 mb-1">Tracking Number / AWB *</label>
                <input type="text" required value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="E.g., DEL123456789IN" className="w-full border border-stone-200 rounded-lg p-2"/>
              </div>
              <div>
                <label className="block text-stone-500 mb-1">Tracking URL (Optional)</label>
                <input type="url" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://track.courier.com/..." className="w-full border border-stone-200 rounded-lg p-2"/>
              </div>
              <div>
                <label className="block text-stone-500 mb-1">Shipment Status</label>
                <select value={shipmentStatus} onChange={(e) => setShipmentStatus(e.target.value)} className="w-full border border-stone-200 rounded-lg p-2 bg-white">
                  <option value="label_created">Label Created / Manifested</option>
                  <option value="in_transit">In Transit / Dispatched</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="reg_provider" checked={registerProvider} onChange={(e) => setRegisterProvider(e.target.checked)}/>
              <label htmlFor="reg_provider" className="text-stone-600 cursor-pointer">
                Register with Automatic Courier Adapter (TrackingMore sync)
              </label>
            </div>

            <button type="submit" disabled={shippingBusy} className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 text-xs font-medium">
              {shippingBusy ? 'Registering Shipment…' : 'Record Shipment & Update Tracking'}
            </button>
          </form>)}
      </div>

      {/* Order Status Transitions (State Machine) */}
      {hasPermission('orders:update_status') && next.length > 0 && (<form className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-medium">Order State Machine Transition</h2>
          <label className="block text-xs text-stone-500">
            Internal Note / Reason
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="E.g., Passed quality check, dispatched via express line" className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"/>
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            {next.map((s) => (<button key={s} type="button" disabled={busy} onClick={(e) => onTransition(e, s)} className="px-3.5 py-2 text-xs font-medium uppercase tracking-wider rounded-lg bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 transition">
                Advance → {s}
              </button>))}
          </div>
        </form>)}
    </div>);
}
