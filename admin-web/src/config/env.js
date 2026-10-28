/**
 * Public admin client configuration (Vite).
 * Only import.meta.env.VITE_* values — no secrets.
 */
export const clientEnv = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
    firebase: {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    },
};
export function isFirebaseConfigured() {
    const f = clientEnv.firebase;
    return Boolean(f.apiKey && f.authDomain && f.projectId && f.appId);
}
export default clientEnv;
