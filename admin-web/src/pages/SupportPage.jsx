import { useEffect, useState } from 'react';
import { listSupportTickets, getSupportTicket, replySupportTicket, updateSupportTicket, ApiError, } from '../services/api';
import { RequirePermission } from '../components/RequireAuth';
import { Lock } from 'lucide-react';
export default function SupportPage() {
    return (<RequirePermission permission="support:read">
      <SupportInner />
    </RequirePermission>);
}
function SupportInner() {
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [replyBusy, setReplyBusy] = useState(false);
    function loadTickets() {
        setLoading(true);
        listSupportTickets()
            .then((res) => setTickets(res.data || []))
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load tickets'))
            .finally(() => setLoading(false));
    }
    useEffect(() => {
        loadTickets();
    }, []);
    function selectTicket(t) {
        getSupportTicket(t.id)
            .then((res) => setSelectedTicket(res.data))
            .catch(() => setSelectedTicket(t));
    }
    async function handleReply(e) {
        e.preventDefault();
        if (!selectedTicket || !replyText.trim())
            return;
        setReplyBusy(true);
        setError(null);
        try {
            await replySupportTicket(selectedTicket.id, replyText.trim(), isInternal);
            setReplyText('');
            selectTicket(selectedTicket);
            loadTickets();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to send message');
        }
        finally {
            setReplyBusy(false);
        }
    }
    async function handleStatusChange(status) {
        if (!selectedTicket)
            return;
        try {
            await updateSupportTicket(selectedTicket.id, status);
            selectTicket(selectedTicket);
            loadTickets();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to update ticket status');
        }
    }
    return (<div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-medium text-stone-900">Customer Support Desk</h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Manage customer inquiries, order assistance tickets, and internal communication
        </p>
      </div>

      {error && <p className="text-red-600 text-xs bg-red-50 p-3 rounded-lg">{error}</p>}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
          <div className="p-3 bg-stone-50 font-medium text-xs text-stone-500">
            Open Tickets ({tickets.length})
          </div>
          <div className="max-h-[600px] overflow-y-auto divide-y divide-stone-100">
            {tickets.map((t) => (<button key={t.id} type="button" onClick={() => selectTicket(t)} className={`w-full text-left p-3.5 hover:bg-stone-50 transition block ${selectedTicket?.id === t.id ? 'bg-stone-100/70 border-l-4 border-stone-900' : ''}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-xs text-stone-800">{t.ticket_number}</span>
                  <span className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${t.priority === 'urgent'
                ? 'bg-red-100 text-red-800'
                : t.priority === 'high'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-200 text-stone-700'}`}>
                    {t.priority}
                  </span>
                </div>
                <p className="text-xs font-medium text-stone-900 truncate">{t.subject}</p>
                <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                  <span className="capitalize">{t.status}</span>
                  <span>{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              </button>))}
            {!tickets.length && !loading && (<p className="p-6 text-center text-xs text-stone-400">No support tickets found.</p>)}
          </div>
        </div>

        {/* Selected Ticket Conversation */}
        <div className="md:col-span-2 bg-white border border-stone-200 rounded-xl p-6 flex flex-col min-h-[500px]">
          {selectedTicket ? (<div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start pb-4 border-b border-stone-100 mb-4">
                <div>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {selectedTicket.ticket_number}
                  </span>
                  <h2 className="text-base font-medium text-stone-900 mt-0.5">
                    {selectedTicket.subject}
                  </h2>
                  {selectedTicket.order_id && (<p className="text-xs text-stone-500 mt-0.5">Linked Order #{selectedTicket.order_id}</p>)}
                </div>
                <div className="flex items-center gap-2">
                  <select value={selectedTicket.status} onChange={(e) => handleStatusChange(e.target.value)} className="text-xs border border-stone-200 rounded p-1.5 bg-white capitalize">
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_customer">Waiting for Customer</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Message thread */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px] pr-2 mb-4">
                {(selectedTicket.messages || []).map((msg) => (<div key={msg.id} className={`p-3.5 rounded-lg text-xs space-y-1 ${msg.is_internal
                    ? 'bg-amber-50 border border-amber-200 text-amber-900 ml-4'
                    : 'bg-stone-50 border border-stone-200 text-stone-800'}`}>
                    <div className="flex justify-between text-[10px] text-stone-400">
                      <span className="font-medium text-stone-700 flex items-center gap-1">
                        {msg.is_internal ? (
                          <>
                            <Lock className="w-3 h-3 text-amber-700" />
                            <span>Internal Staff Note</span>
                          </>
                        ) : (
                          msg.sender_name || 'Staff / Customer'
                        )}
                      </span>
                      <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  </div>))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleReply} className="pt-3 border-t border-stone-100 space-y-3">
                <textarea rows={3} required value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type reply or internal note..." className="w-full border border-stone-200 rounded-lg p-2.5 text-xs"/>
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
                    <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)}/>
                    <span>Post as Internal Note</span>
                  </label>
                  <button type="submit" disabled={replyBusy} className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 disabled:opacity-50">
                    {replyBusy ? 'Posting…' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>) : (<div className="flex-1 flex items-center justify-center text-xs text-stone-400">
              Select a ticket on the left to view message history and reply.
            </div>)}
        </div>
      </div>
    </div>);
}
