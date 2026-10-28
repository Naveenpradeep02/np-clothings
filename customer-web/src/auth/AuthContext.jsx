import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clientEnv, isFirebaseConfigured } from '../config/env';
import { getMe, loginUser, registerUser, setTokenGetter } from '../services/api';
const defaultAuthContext = {
    user: null,
    loading: false,
    error: null,
    login: async () => {},
    register: async () => {},
    loginWithToken: async () => {},
    loginAsDemo: async () => {},
    logout: async () => {},
    firebaseReady: false,
};
const AuthContext = createContext(defaultAuthContext);
const TOKEN_KEY = 'aurea_customer_token';
async function loadFirebase() {
    if (!isFirebaseConfigured())
        return null;
    const { initializeApp, getApps } = await import('firebase/app');
    const { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } = await import('firebase/auth');
    const app = getApps().length ? getApps()[0] : initializeApp(clientEnv.firebase);
    return { auth: getAuth(app), signInWithEmailAndPassword, signOut, onAuthStateChanged };
}
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [manualToken, setManualToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
    const [fb, setFb] = useState(null);
    useEffect(() => {
        setTokenGetter(async () => {
            if (manualToken)
                return manualToken;
            if (fb?.auth.currentUser)
                return fb.auth.currentUser.getIdToken();
            return null;
        });
    }, [manualToken, fb]);
    const loadProfile = useCallback(async () => {
        const res = await getMe();
        const raw = res.data?.user || res.data;
        setUser(raw);
        setError(null);
    }, []);
    useEffect(() => {
        let unsub = () => { };
        (async () => {
            try {
                const firebase = await loadFirebase();
                setFb(firebase);
                if (firebase) {
                    unsub = firebase.onAuthStateChanged(firebase.auth, async (u) => {
                        if (u) {
                            try {
                                await loadProfile();
                            }
                            catch (e) {
                                setUser(null);
                                setError(e instanceof Error ? e.message : 'Auth error');
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
                        await loadProfile();
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
    }, [loadProfile]);
    const login = async (email, password) => {
        setError(null);
        if (fb) {
            await fb.signInWithEmailAndPassword(fb.auth, email, password);
            await loadProfile();
            return;
        }
        const res = await loginUser(email, password);
        const token = res.data?.token || res.token;
        if (token) {
            sessionStorage.setItem(TOKEN_KEY, token);
            setManualToken(token);
            setTokenGetter(async () => token);
        }
        if (res.data?.user) {
            setUser(res.data.user);
            setError(null);
        } else {
            await loadProfile();
        }
    };
    const register = async (payload) => {
        setError(null);
        const res = await registerUser(payload);
        const token = res.data?.token || res.token;
        if (token) {
            sessionStorage.setItem(TOKEN_KEY, token);
            setManualToken(token);
            setTokenGetter(async () => token);
        }
        if (res.data?.user) {
            setUser(res.data.user);
            setError(null);
        } else {
            await loadProfile();
        }
    };
    const loginWithToken = async (token) => {
        setError(null);
        sessionStorage.setItem(TOKEN_KEY, token.trim());
        setManualToken(token.trim());
        setTokenGetter(async () => token.trim());
        await loadProfile();
    };
    const loginAsDemo = async (role = 'customer') => {
        setError(null);
        const token = role === 'vip'
            ? 'dev:cust_priya|priya.sharma@aurea.luxury|Priya Sharma|customer'
            : 'dev:cust_naveen|naveen@aurea.luxury|Naveen Kumar|customer';
        sessionStorage.setItem(TOKEN_KEY, token);
        setManualToken(token);
        setTokenGetter(async () => token);
        await loadProfile();
    };
    const logout = async () => {
        sessionStorage.removeItem(TOKEN_KEY);
        setManualToken(null);
        setUser(null);
        if (fb?.auth.currentUser)
            await fb.signOut(fb.auth);
    };
    return (<AuthContext.Provider value={{ user, loading, error, login, register, loginWithToken, loginAsDemo, logout, firebaseReady: Boolean(fb) }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    return ctx || defaultAuthContext;
}
