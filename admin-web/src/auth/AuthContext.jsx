import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isFirebaseConfigured, clientEnv } from '../config/env';
import { getMe, setTokenGetter, ApiError, loginAdmin } from '../services/api';
const defaultAdminAuthContext = {
    user: null,
    loading: false,
    error: null,
    permissions: new Set(),
    hasPermission: () => false,
    login: async () => {},
    loginWithToken: async () => {},
    loginAsDemoRole: async () => {},
    logout: async () => {},
    refresh: async () => {},
    firebaseReady: false,
};
const AuthContext = createContext(defaultAdminAuthContext);
const TOKEN_KEY = 'aurea_admin_token';
async function loadFirebaseAuth() {
    if (!isFirebaseConfigured())
        return null;
    const { initializeApp, getApps } = await import('firebase/app');
    const { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } = await import('firebase/auth');
    const app = getApps().length ? getApps()[0] : initializeApp(clientEnv.firebase);
    const auth = getAuth(app);
    return { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged };
}
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [manualToken, setManualToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
    const [firebaseAuth, setFirebaseAuth] = useState(null);
    const permissions = useMemo(() => new Set(user?.permissions || []), [user]);
    const hasPermission = useCallback((...codes) => codes.every((c) => permissions.has(c)), [permissions]);
    useEffect(() => {
        setTokenGetter(async () => {
            if (manualToken)
                return manualToken;
            if (firebaseAuth?.auth.currentUser) {
                return firebaseAuth.auth.currentUser.getIdToken();
            }
            return null;
        });
    }, [manualToken, firebaseAuth]);
    const fetchProfile = useCallback(async () => {
        try {
            const res = await getMe();
            const data = res.data;
            if (data.user_type !== 'employee') {
                throw new ApiError('This account is not an employee', 403, 'FORBIDDEN');
            }
            setUser({
                ...data,
                permissions: data.permissions || [],
                roles: data.roles || [],
            });
            setError(null);
        }
        catch (err) {
            setUser(null);
            if (err instanceof ApiError)
                setError(err.message);
            else
                setError('Unable to load profile');
            throw err;
        }
    }, []);
    useEffect(() => {
        let unsub = () => { };
        (async () => {
            try {
                const fb = await loadFirebaseAuth();
                setFirebaseAuth(fb);
                if (fb) {
                    unsub = fb.onAuthStateChanged(fb.auth, async (u) => {
                        if (u) {
                            try {
                                await fetchProfile();
                            }
                            catch {
                                /* profile error already set */
                            }
                        }
                        else if (!sessionStorage.getItem(TOKEN_KEY)) {
                            setUser(null);
                        }
                        setLoading(false);
                    });
                    return;
                }
                if (sessionStorage.getItem(TOKEN_KEY)) {
                    try {
                        await fetchProfile();
                    }
                    catch {
                        sessionStorage.removeItem(TOKEN_KEY);
                        setManualToken(null);
                    }
                }
            }
            finally {
                setLoading(false);
            }
        })();
        return () => unsub();
    }, [fetchProfile]);
    const login = async (email, password, role = 'super_admin') => {
        setError(null);
        if (firebaseAuth) {
            await firebaseAuth.signInWithEmailAndPassword(firebaseAuth.auth, email, password);
            await fetchProfile();
            return;
        }
        const res = await loginAdmin(email, password, role);
        const token = res.data?.token || res.token;
        if (token) {
            sessionStorage.setItem(TOKEN_KEY, token);
            setManualToken(token);
            setTokenGetter(async () => token);
        }
        await fetchProfile();
    };
    const loginWithToken = async (token) => {
        setError(null);
        sessionStorage.setItem(TOKEN_KEY, token.trim());
        setManualToken(token.trim());
        setTokenGetter(async () => token.trim());
        await fetchProfile();
    };
    const loginAsDemoRole = async (roleCode = 'super_admin') => {
        setError(null);
        const roleMap = {
            super_admin: { uid: 'adm_super', email: 'admin@aurea.luxury', name: 'Naveen (Super Admin)' },
            order_manager: { uid: 'adm_order', email: 'orders@aurea.luxury', name: 'Order Manager' },
            catalog_manager: { uid: 'adm_catalog', email: 'catalog@aurea.luxury', name: 'Catalog Manager' },
            support_team: { uid: 'adm_support', email: 'support@aurea.luxury', name: 'Support Lead' },
        };
        const selected = roleMap[roleCode] || roleMap.super_admin;
        const token = `dev:${selected.uid}|${selected.email}|${selected.name}|${roleCode}`;
        sessionStorage.setItem(TOKEN_KEY, token);
        setManualToken(token);
        setTokenGetter(async () => token);
        await fetchProfile();
    };
    const logout = async () => {
        sessionStorage.removeItem(TOKEN_KEY);
        setManualToken(null);
        setUser(null);
        if (firebaseAuth?.auth.currentUser) {
            await firebaseAuth.signOut(firebaseAuth.auth);
        }
    };
    const value = {
        user,
        loading,
        error,
        permissions,
        hasPermission,
        login,
        loginWithToken,
        loginAsDemoRole,
        logout,
        refresh: fetchProfile,
        firebaseReady: Boolean(firebaseAuth),
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    return ctx || defaultAdminAuthContext;
}
