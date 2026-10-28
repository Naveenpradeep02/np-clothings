import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { MessageCircle, Check } from 'lucide-react';
import { getOrder, getOrderShipments, createReturnRequest, createSupportTicket, } from '../services/api';
const ORDER_STEPS = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'In Production' },
    { key: 'packed', label: 'Packed' },
    { key: 'shipped', label: 'Dispatched' },
    { key: 'delivered', label: 'Delivered' },
];
function getStepIndex(status) {
    switch (status?.toLowerCase()) {
        case 'pending':
            return 0;
        case 'confirmed':
            return 1;
        case 'processing':
            return 2;
        case 'packed':
            return 3;
        case 'shipped':
            return 4;
        case 'delivered':
            return 5;
        default:
            return 0;
    }
}
export default function OrderDetailPage() {
    const { id } = useParams();
    const { user, loading: authLoading } = useAuth();
    const [order, setOrder] = useState(null);
    const [shipments, setShipments] = useState([]);
    const [error, setError] = useState(null);
    // Return state
    const [showReturnForm, setShowReturnForm] = useState(false);
    const [returnReason, setReturnReason] = useState('size_issue');
    const [returnComment, setReturnComment] = useState('');
    const [returnSubmitting, setReturnSubmitting] = useState(false);
    const [returnMessage, setReturnMessage] = useState(null);
    // Ticket state
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketMessage, setTicketMessage] = useState('');
    const [ticketSubmitting, setTicketSubmitting] = useState(false);
    const [ticketSuccess, setTicketSuccess] = useState(null);
    useEffect(() => {
        if (!user || !id)
            return;
        getOrder(id)
            .then((res) => {
            setOrder(res.data);
            getOrderShipments(id)
                .then((sRes) => setShipments(sRes.data || []))
                .catch(() => { });
        })
            .catch((err) => setError(err.message || 'Order not found'));
    }, [user, id]);
    if (authLoading) {
        return (<Layout>
        <p className="p-16 text-center text-stone-400 text-sm">Loading order details…</p>
      </Layout>);
    }
    if (!user)
        return <Navigate to="/login" replace/>;
    const items = order?.items || [];
    const status = String(order?.status || 'pending').toLowerCase();
    const currentStep = getStepIndex(status);
    const isDelivered = status === 'delivered';
    const shippingAddr = order?.shipping_address || {};
    async function handleReturnSubmit(e) {
        e.preventDefault();
        if (!order)
            return;
        setReturnSubmitting(true);
        setReturnMessage(null);
        try {
            const returnItems = items.map((it) => ({
                order_item_id: Number(it.id),
                quantity: Number(it.quantity || 1),
                condition_notes: returnComment,
            }));
            await createReturnRequest({
                order_id: Number(order.id),
                reason_code: returnReason,
                items: returnItems,
                customer_comment: returnComment,
            });
            setReturnMessage('Return/exchange request submitted successfully. Our support team will review within 24 hours.');
            setShowReturnForm(false);
        }
        catch (err) {
            setReturnMessage(err instanceof Error ? err.message : 'Failed to submit return request.');
        }
        finally {
            setReturnSubmitting(false);
        }
    }
    async function handleTicketSubmit(e) {
        e.preventDefault();
        if (!order)
            return;
        setTicketSubmitting(true);
        setTicketSuccess(null);
        try {
            await createSupportTicket({
                order_id: Number(order.id),
                subject: ticketSubject || `Assistance with Order ${order.order_number}`,
                body: ticketMessage,
                priority: 'medium',
            });
            setTicketSuccess('Support ticket created. You can track replies in your Account.');
            setShowTicketForm(false);
            setTicketMessage('');
        }
        catch (err) {
            setTicketSuccess(err instanceof Error ? err.message : 'Failed to create support ticket.');
        }
        finally {
            setTicketSubmitting(false);
        }
    }
    const whatsappMessage = encodeURIComponent(`Hello Aurea Support, I need assistance with Order #${order?.order_number}.`);
    return (<Layout>
      <Seo title={`Order ${order?.order_number || ''} | AUREA`} noindex/>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link to="/account/orders" className="text-xs tracking-widest uppercase text-neutral-400 hover:text-neutral-900 transition mb-6 inline-block">
          ← Back to Orders
        </Link>

        {error && <p className="text-red-600 text-sm mt-4 bg-red-50 p-4 rounded">{error}</p>}

        {order && (<div className="space-y-8">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200">
              <div>
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#c9a96e] block mb-1">
                  Confirmed Order
                </span>
                <h1 className="text-2xl font-light tracking-wide text-neutral-900">
                  {String(order.order_number)}
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Placed on {order.created_at ? new Date(String(order.created_at)).toLocaleString() : 'Recent'}
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex gap-3 items-center">
                <span className="inline-block px-3 py-1 text-xs uppercase tracking-widest font-medium bg-neutral-900 text-white rounded">
                  {status}
                </span>
                <a href={`https://wa.me/918870686660?text=${whatsappMessage}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 text-xs border border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded transition" title="WhatsApp Support">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Support</span>
                </a>
              </div>
            </div>

            {/* Tracking Stepper */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xs tracking-widest uppercase text-neutral-400 mb-6">Fulfillment Progress</h2>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
                {ORDER_STEPS.map((step, idx) => {
                const isPassed = currentStep >= idx;
                const isCurrent = currentStep === idx;
                return (<div key={step.key} className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold mb-2 transition ${isCurrent
                        ? 'bg-neutral-900 text-white ring-4 ring-neutral-200'
                        : isPassed
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-400 border border-neutral-200'}`}>
                        {isPassed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <p className={`text-xs ${isCurrent ? 'font-semibold text-neutral-900' : isPassed ? 'text-neutral-700' : 'text-neutral-400'}`}>
                        {step.label}
                      </p>
                    </div>);
            })}
              </div>

              {/* Courier Shipment Detail if dispatched */}
              {shipments.length > 0 && (<div className="mt-6 pt-6 border-t border-neutral-100">
                  <p className="text-xs tracking-widest uppercase text-[#c9a96e] mb-3">Courier Dispatch Details</p>
                  {shipments.map((shipment) => (<div key={shipment.id} className="bg-[#fcfbf9] border border-stone-200 rounded-lg p-4 space-y-2 text-xs">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div>
                          <span className="font-medium text-neutral-800">{shipment.courier_name}</span>
                          <span className="text-neutral-400 ml-2">AWB: {shipment.tracking_number}</span>
                        </div>
                        {shipment.tracking_url && (<a href={shipment.tracking_url} target="_blank" rel="noreferrer" className="text-xs underline text-neutral-800 hover:text-black font-medium">
                            Live Carrier Tracking ↗
                          </a>)}
                      </div>
                      {shipment.events && shipment.events.length > 0 && (<div className="mt-3 pt-3 border-t border-stone-200 space-y-2">
                          <p className="text-[10px] uppercase tracking-wider text-neutral-400">Tracking Milestones</p>
                          {shipment.events.map((ev) => (<div key={ev.id} className="flex justify-between text-neutral-600">
                              <span>• {ev.description || ev.status} {ev.location ? `(${ev.location})` : ''}</span>
                              <span className="text-neutral-400 text-[10px]">{ev.event_time ? new Date(ev.event_time).toLocaleDateString() : ''}</span>
                            </div>))}
                        </div>)}
                    </div>))}
                </div>)}
            </div>

            {/* Order Items */}
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-neutral-50/50 border-b border-neutral-100">
                <h2 className="text-xs tracking-widest uppercase text-neutral-500">Purchased Items</h2>
              </div>
              <div className="divide-y divide-neutral-100">
                {items.map((it) => (<div key={String(it.id)} className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{String(it.product_name)}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">SKU: {String(it.sku)}</p>
                      {Array.isArray(it.selected_options) && it.selected_options.length > 0 && (<div className="flex flex-wrap gap-1.5 mt-2">
                          {it.selected_options.map((opt, i) => (<span key={i} className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                              {String(opt.group_name || opt.name)}: {String(opt.option_name || opt.value || '')}
                            </span>))}
                        </div>)}
                    </div>
                    <div className="text-right sm:self-center">
                      <p className="text-xs text-neutral-400">Qty: {String(it.quantity)} × ₹{Number(it.unit_price || 0).toLocaleString('en-IN')}</p>
                      <p className="text-sm font-medium text-neutral-900 mt-1">₹{Number(it.line_total || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>))}
              </div>
            </div>

            {/* Address & Totals Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Shipping Address */}
              <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs tracking-widest uppercase text-neutral-400 mb-3">Shipping Destination</h3>
                <p className="text-sm font-medium text-neutral-900">{shippingAddr.full_name || 'N/A'}</p>
                <p className="text-xs text-neutral-600 mt-1">{shippingAddr.line1}</p>
                {shippingAddr.line2 && <p className="text-xs text-neutral-600">{shippingAddr.line2}</p>}
                <p className="text-xs text-neutral-600">
                  {shippingAddr.city}, {shippingAddr.state} {shippingAddr.postal_code}
                </p>
                {shippingAddr.phone && <p className="text-xs text-neutral-400 mt-2">Phone: {shippingAddr.phone}</p>}
              </div>

              {/* Price Summary */}
              <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-2 text-xs">
                <h3 className="text-xs tracking-widest uppercase text-neutral-400 mb-3">Cost Breakdown</h3>
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                {Number(order.discount_amount || 0) > 0 && (<div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>−₹{Number(order.discount_amount).toLocaleString('en-IN')}</span>
                  </div>)}
                <div className="flex justify-between text-neutral-600">
                  <span>Tax</span>
                  <span>₹{Number(order.tax_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span>{Number(order.shipping_amount) === 0 ? 'Free' : `₹${Number(order.shipping_amount).toLocaleString('en-IN')}`}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-neutral-900 pt-2 border-t border-neutral-100">
                  <span>Total Amount</span>
                  <span>₹{Number(order.grand_total || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Actions: Return / Exchange & Support Tickets */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Need Assistance or Size Exchange?</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    We offer size exchanges and returns for open-box damaged items within 14 days.
                  </p>
                </div>
                <div className="flex gap-3">
                  {isDelivered && (<button type="button" onClick={() => setShowReturnForm(!showReturnForm)} className="px-4 py-2 border border-neutral-900 text-neutral-900 text-xs tracking-wider uppercase rounded hover:bg-neutral-900 hover:text-white transition">
                      {showReturnForm ? 'Close Return' : 'Request Return / Exchange'}
                    </button>)}
                  <button type="button" onClick={() => setShowTicketForm(!showTicketForm)} className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs tracking-wider uppercase rounded hover:border-neutral-900 transition">
                    {showTicketForm ? 'Close Ticket' : 'Raise Support Ticket'}
                  </button>
                </div>
              </div>

              {returnMessage && (<div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 rounded">
                  {returnMessage}
                </div>)}
              {ticketSuccess && (<div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 rounded">
                  {ticketSuccess}
                </div>)}

              {/* Return Form */}
              {showReturnForm && (<form onSubmit={handleReturnSubmit} className="mt-6 pt-6 border-t border-neutral-100 space-y-4">
                  <h4 className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Initiate Return or Size Exchange</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Reason for Return</label>
                      <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full border border-neutral-300 rounded px-3 py-2 text-xs bg-white">
                        <option value="size_issue">Size / Fit Issue (Size Exchange)</option>
                        <option value="open_box_damage">Open-Box Damage / Transit Defect</option>
                        <option value="other">Other Inquiry</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Details & Exchange Preference</label>
                      <input type="text" required value={returnComment} onChange={(e) => setReturnComment(e.target.value)} placeholder="E.g., Need Size L instead of M" className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"/>
                    </div>
                  </div>
                  <button type="submit" disabled={returnSubmitting} className="bg-neutral-900 text-white text-xs tracking-wider uppercase py-2.5 px-6 rounded hover:bg-neutral-800 disabled:opacity-50">
                    {returnSubmitting ? 'Submitting…' : 'Submit Return Request'}
                  </button>
                </form>)}

              {/* Support Ticket Form */}
              {showTicketForm && (<form onSubmit={handleTicketSubmit} className="mt-6 pt-6 border-t border-neutral-100 space-y-4">
                  <h4 className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Create Support Ticket</h4>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Subject</label>
                    <input type="text" required value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder={`Query regarding Order #${order.order_number}`} className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"/>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Message</label>
                    <textarea rows={3} required value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} placeholder="Describe what you need help with..." className="w-full border border-neutral-300 rounded px-3 py-2 text-xs"/>
                  </div>
                  <button type="submit" disabled={ticketSubmitting} className="bg-neutral-900 text-white text-xs tracking-wider uppercase py-2.5 px-6 rounded hover:bg-neutral-800 disabled:opacity-50">
                    {ticketSubmitting ? 'Sending Ticket…' : 'Submit Ticket'}
                  </button>
                </form>)}
            </div>
          </div>)}
      </div>
    </Layout>);
}
