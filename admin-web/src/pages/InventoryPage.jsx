import { useState } from 'react';
import { adjustInventory, ApiError } from '../services/api';
import { RequirePermission } from '../components/RequireAuth';
import { useAuth } from '../auth/AuthContext';
export default function InventoryPage() {
    return (<RequirePermission permission="inventory:read">
      <InventoryInner />
    </RequirePermission>);
}
function InventoryInner() {
    const { hasPermission } = useAuth();
    const [variantId, setVariantId] = useState('');
    const [delta, setDelta] = useState('1');
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    async function onSubmit(e) {
        e.preventDefault();
        if (!hasPermission('inventory:write') && !hasPermission('inventory:adjust')) {
            setError('Missing inventory write permission');
            return;
        }
        setBusy(true);
        setError(null);
        setMessage(null);
        try {
            await adjustInventory({
                variant_id: Number(variantId),
                quantity_delta: Number(delta),
                reason: reason || undefined,
            });
            setMessage('Stock adjusted successfully');
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Adjust failed');
        }
        finally {
            setBusy(false);
        }
    }
    return (<div className="max-w-md">
      <h1 className="text-lg font-medium mb-6">Inventory adjust</h1>
      <form onSubmit={onSubmit} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <label className="block text-xs text-stone-500">
          Variant ID
          <input required type="number" value={variantId} onChange={(e) => setVariantId(e.target.value)} className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"/>
        </label>
        <label className="block text-xs text-stone-500">
          Quantity delta (+/−)
          <input required type="number" value={delta} onChange={(e) => setDelta(e.target.value)} className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"/>
        </label>
        <label className="block text-xs text-stone-500">
          Reason
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"/>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button type="submit" disabled={busy} className="w-full bg-stone-900 text-white rounded-lg py-2 text-sm disabled:opacity-50">
          {busy ? 'Saving…' : 'Apply adjustment'}
        </button>
      </form>
    </div>);
}
