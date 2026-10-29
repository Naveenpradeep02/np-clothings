import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
    const { user, login, register, loginWithToken, loginAsDemo, error } = useAuth();
    const location = useLocation();
    const from = location.state?.from || '/account';

    const [tab, setTab] = useState('signin'); // 'signin' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
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
            await login(email, password);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Login failed. Please check credentials.');
        } finally {
            setBusy(false);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        setBusy(true);
        setLocalError(null);
        try {
            await register({
                email,
                password,
                firstName,
                lastName,
                phone,
            });
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Registration failed.');
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
            setLocalError(err instanceof Error ? err.message : 'Invalid token.');
        } finally {
            setBusy(false);
        }
    }

    async function handleQuickDemo(type) {
        setBusy(true);
        setLocalError(null);
        try {
            await loginAsDemo(type);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Demo login failed');
        } finally {
            setBusy(false);
        }
    }

    return (
        <Layout>
            <Seo title={tab === 'signin' ? 'Sign In — NP Clothings' : 'Create Atelier Account — NP Clothings'} noindex />
            <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <span className="text-[11px] uppercase tracking-[0.35em] text-[#c9a96e] font-medium">
                        Quiet Luxury Atelier
                    </span>
                    <h1 className="mt-2 text-3xl font-serif text-stone-900 tracking-tight">
                        {tab === 'signin' ? 'Welcome Back' : 'Create an Account'}
                    </h1>
                    <p className="mt-1 text-xs text-stone-500">
                        {tab === 'signin'
                            ? 'Sign in to access your bespoke orders, wishlist & measurements'
                            : 'Join NP Clothings to experience custom-tailored luxury garments'}
                    </p>
                </div>

                <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
                    {/* Tab Navigation */}
                    <div className="flex bg-stone-100/80 p-1 rounded-xl mb-6 text-xs font-medium">
                        <button
                            type="button"
                            className={`flex-1 py-2 rounded-lg transition-all ${
                                tab === 'signin'
                                    ? 'bg-white text-stone-900 shadow-sm'
                                    : 'text-stone-500 hover:text-stone-800'
                            }`}
                            onClick={() => {
                                setTab('signin');
                                setLocalError(null);
                            }}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2 rounded-lg transition-all ${
                                tab === 'register'
                                    ? 'bg-white text-stone-900 shadow-sm'
                                    : 'text-stone-500 hover:text-stone-800'
                            }`}
                            onClick={() => {
                                setTab('register');
                                setLocalError(null);
                            }}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Sign In Form */}
                    {tab === 'signin' && (
                        <form onSubmit={handleSignIn} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="your.email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
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
                                    className="w-full border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
                                />
                            </div>

                            {(localError || error) && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                                    {localError || error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={busy}
                                className="w-full bg-stone-900 hover:bg-black text-white font-medium rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
                            >
                                {busy ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>
                    )}

                    {/* Register Form */}
                    {tab === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-3.5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-stone-700 mb-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Naveen"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-700 mb-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Kumar"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="naveen@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                    Phone (optional)
                                </label>
                                <input
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-700 mb-1">
                                    Create Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900"
                                />
                            </div>

                            {(localError || error) && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                                    {localError || error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={busy}
                                className="w-full bg-[#c9a96e] hover:bg-[#b89555] text-stone-950 font-medium rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50 mt-1"
                            >
                                {busy ? 'Creating account…' : 'Create My Account'}
                            </button>
                        </form>
                    )}

                    {/* Quick Demo Section */}
                    <div className="mt-6 pt-5 border-t border-stone-100">
                        <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold text-center mb-3 flex items-center justify-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#c9a96e]" />
                            <span>Quick 1-Click Demo Login</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleQuickDemo('customer')}
                                className="px-3 py-2 border border-stone-200 rounded-lg text-stone-700 hover:border-[#c9a96e] hover:bg-stone-50 transition-colors text-center"
                            >
                                <span className="font-semibold block">Naveen Kumar</span>
                                <span className="text-[10px] text-stone-400">Regular Customer</span>
                            </button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleQuickDemo('vip')}
                                className="px-3 py-2 border border-stone-200 rounded-lg text-stone-700 hover:border-[#c9a96e] hover:bg-stone-50 transition-colors text-center"
                            >
                                <span className="font-semibold block">Priya Sharma</span>
                                <span className="text-[10px] text-[#c9a96e]">VIP Customer</span>
                            </button>
                        </div>
                    </div>

                    {/* Developer Token Option (Subtle collapsible) */}
                    <div className="mt-4 pt-3 border-t border-stone-100 text-center">
                        <button
                            type="button"
                            onClick={() => setShowDevToken(!showDevToken)}
                            className="text-[11px] text-stone-400 hover:text-stone-600 underline"
                        >
                            {showDevToken ? '▲ Hide token input' : '▼ Developer token input'}
                        </button>
                        {showDevToken && (
                            <form onSubmit={handleTokenSubmit} className="mt-3 text-left">
                                <label className="block text-[11px] text-stone-500 mb-1">
                                    Raw ID / Dev Bearer token:
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Paste token or dev:uid|email|name|role"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="w-full border border-stone-200 rounded-lg p-2 text-xs font-mono"
                                />
                                <button
                                    type="submit"
                                    disabled={busy || !token.trim()}
                                    className="mt-2 w-full py-1.5 text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium disabled:opacity-40"
                                >
                                    Sign in with token
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-stone-500 mt-6">
                    <Link to="/shop" className="hover:text-stone-900 transition-colors">
                        ← Continue shopping
                    </Link>
                </p>
            </div>
        </Layout>
    );
}
