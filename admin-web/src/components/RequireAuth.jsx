import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
export function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center text-stone-500 text-sm">
        Loading…
      </div>);
    }
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
    }
    return children;
}
export function RequirePermission({ permission, children, }) {
    const { hasPermission } = useAuth();
    if (!hasPermission(permission)) {
        return (<div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-stone-500">
        You do not have permission for this module ({permission}).
      </div>);
    }
    return children;
}
