import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ShieldCheck, Boxes, Tag, Headphones, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const { user, login, loginAsDemoRole, loginWithToken, error } = useAuth();
    const location = useLocation();
    const from = location.state?.from || '/';

    const [email, setEmail] = useState('admin@aurea.luxury');
    const [password, setPassword] = useState('admin123');
    const [selectedRole, setSelectedRole] = useState('super_admin');
    const [token, setToken] = useState('');
    const [showDevToken, setShowDevToken] = useState(false);
    const [busy, setBusy] = useState(false);
    const [localError, setLocalError] = useState(null);

    if (user) {
        return <Navigate to={from} replace />;
    }

    async function handleSignIn(e) {
        e.preventDefault();
        setBusy(true);
        setLocalError(null);
        try {
            await login(email, password, selectedRole);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Admin sign-in failed');
        } finally {
            setBusy(false);
        }
    }

    async function handleQuickRole(roleCode) {
        setBusy(true);
        setLocalError(null);
        try {
            await loginAsDemoRole(roleCode);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Quick role login failed');
        } finally {
            setBusy(false);
        }
    }

    async function handleTokenSubmit(e) {
        e.preventDefault();
        if (!token.trim()) return;
        setBusy(true);
        setLocalError(null);
        try {
            await loginWithToken(token);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Invalid token');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-100/80 py-12 px-4 sm:px-6">
            <div className="w-full max-w-lg bg-white border border-stone-200/90 rounded-2xl shadow-xl p-8 sm:p-10 text-stone-900">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <span className="text-[11px] uppercase tracking-[0.35em] text-[#c9a96e] font-semibold">
                        Operations & Management
                    </span>
                    <h1 className="mt-2 text-2xl sm:text-3xl font-serif tracking-widest uppercase text-stone-900">
                        AUR<span className="text-[#c9a96e]">EA</span>
                    </h1>
                    <p className="mt-1 text-xs text-stone-500">
                        Luxury Commerce Administration & RBAC Portal
                    </p>
                </div>

                {/* Email / Password Sign In */}
                <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                            Staff / Admin Email
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="admin@aurea.luxury"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-medium text-stone-700">
                                Password
                            </label>
                            <span className="text-[11px] text-stone-400">Default: any password</span>
                        </div>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                            Role Assignment
                        </label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-xs text-stone-800 focus:bg-white focus:outline-none focus:border-stone-900"
                        >
                            <option value="super_admin">Super Admin (Full Platform Control)</option>
                            <option value="order_manager">Order Manager (Orders & Fulfillment)</option>
                            <option value="catalog_manager">Catalog Manager (Products & Variants)</option>
                            <option value="support_team">Support Team (Returns & Tickets)</option>
                        </select>
                    </div>

                    {(localError || error) && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                            {localError || error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full bg-stone-900 hover:bg-black text-white font-medium rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {busy ? 'Verifying access…' : 'Sign In to Admin Portal'}
                    </button>
                </form>

                {/* 1-Click Role Access */}
                <div className="mt-8 pt-6 border-t border-stone-100">
                    <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold text-center mb-3 flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#c9a96e]" />
                        <span>Quick 1-Click Role Login</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleQuickRole('super_admin')}
                            className="p-3 bg-stone-50/80 border border-stone-200 hover:border-stone-900 hover:bg-white rounded-xl text-left transition-all group"
                        >
                            <div className="font-semibold text-stone-900 group-hover:text-black flex items-center justify-between">
                                <span>Super Admin</span>
                                <ShieldCheck className="w-4 h-4 text-[#c9a96e]" />
                            </div>
                            <div className="text-[10px] text-stone-500 mt-0.5">admin@aurea.luxury</div>
                        </button>

                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleQuickRole('order_manager')}
                            className="p-3 bg-stone-50/80 border border-stone-200 hover:border-stone-900 hover:bg-white rounded-xl text-left transition-all group"
                        >
                            <div className="font-semibold text-stone-900 group-hover:text-black flex items-center justify-between">
                                <span>Order Manager</span>
                                <Boxes className="w-4 h-4 text-stone-600 group-hover:text-stone-900" />
                            </div>
                            <div className="text-[10px] text-stone-500 mt-0.5">orders@aurea.luxury</div>
                        </button>

                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleQuickRole('catalog_manager')}
                            className="p-3 bg-stone-50/80 border border-stone-200 hover:border-stone-900 hover:bg-white rounded-xl text-left transition-all group"
                        >
                            <div className="font-semibold text-stone-900 group-hover:text-black flex items-center justify-between">
                                <span>Catalog Lead</span>
                                <Tag className="w-4 h-4 text-stone-600 group-hover:text-stone-900" />
                            </div>
                            <div className="text-[10px] text-stone-500 mt-0.5">catalog@aurea.luxury</div>
                        </button>

                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleQuickRole('support_team')}
                            className="p-3 bg-stone-50/80 border border-stone-200 hover:border-stone-900 hover:bg-white rounded-xl text-left transition-all group"
                        >
                            <div className="font-semibold text-stone-900 group-hover:text-black flex items-center justify-between">
                                <span>Support Desk</span>
                                <Headphones className="w-4 h-4 text-stone-600 group-hover:text-stone-900" />
                            </div>
                            <div className="text-[10px] text-stone-500 mt-0.5">support@aurea.luxury</div>
                        </button>
                    </div>
                </div>

                {/* Developer Token Access (Collapsible) */}
                <div className="mt-6 pt-4 border-t border-stone-100 text-center">
                    <button
                        type="button"
                        onClick={() => setShowDevToken(!showDevToken)}
                        className="text-[11px] text-stone-400 hover:text-stone-700 underline"
                    >
                        {showDevToken ? '▲ Hide token input' : '▼ Developer token input'}
                    </button>
                    {showDevToken && (
                        <form onSubmit={handleTokenSubmit} className="mt-3 text-left">
                            <label className="block text-[11px] text-stone-500 mb-1">
                                Raw Firebase or Dev Token:
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Paste token or dev:uid|email|name|role"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs font-mono text-stone-800"
                            />
                            <button
                                type="submit"
                                disabled={busy || !token.trim()}
                                className="mt-2 w-full py-1.5 text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium disabled:opacity-40"
                            >
                                Authenticate with token
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
