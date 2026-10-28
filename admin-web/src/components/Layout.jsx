import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
    LayoutDashboard,
    ShoppingBag,
    Shirt,
    FolderTree,
    SlidersHorizontal,
    Tag,
    Boxes,
    RotateCcw,
    Headphones,
    FileText,
    Users,
    TicketPercent,
    LogOut
} from 'lucide-react';

const NAV = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders', label: 'Orders', icon: ShoppingBag, permission: 'orders:read' },
    { to: '/products', label: 'Products', icon: Shirt, permission: 'products:read' },
    { to: '/categories', label: 'Categories', icon: FolderTree, permission: 'categories:read' },
    { to: '/variants', label: 'Variant Sets', icon: SlidersHorizontal },
    { to: '/brands', label: 'Brands', icon: Tag, permission: 'brands:read' },
    { to: '/inventory', label: 'Inventory', icon: Boxes, permission: 'inventory:read' },
    { to: '/returns', label: 'Returns & Refunds', icon: RotateCcw, permission: 'returns:read' },
    { to: '/support', label: 'Support Desk', icon: Headphones, permission: 'support:read' },
    { to: '/cms', label: 'CMS', icon: FileText, permission: 'cms:read' },
    { to: '/customers', label: 'Customers', icon: Users, permission: 'customers:read' },
    { to: '/coupons', label: 'Coupons', icon: TicketPercent, permission: 'coupons:read' },
];

export default function Layout() {
    const { user, logout, hasPermission } = useAuth();
    const items = NAV.filter((n) => !n.permission || hasPermission(n.permission));

    const roleLabel = (user?.roles || [])
        .map((r) => (typeof r === 'string' ? r : r.name || r.code))
        .filter(Boolean)
        .join(', ');

    return (<div className="min-h-screen flex bg-stone-100/70">
      <aside className="w-56 shrink-0 bg-white border-r border-stone-200 text-stone-600 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-stone-200 tracking-[0.15em] uppercase text-sm text-stone-900 font-semibold">
          NP <span className="text-[#c9a96e]">Clothings</span>
          <span className="ml-2 text-stone-400 normal-case tracking-normal text-xs font-normal">Admin</span>
        </div>
        <nav className="flex-1 py-3 text-xs space-y-0.5" aria-label="Admin">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `flex items-center gap-2.5 px-5 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-stone-100 text-stone-900 font-semibold border-r-2 border-[#c9a96e]'
                    : 'hover:text-stone-900 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 text-stone-400" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-stone-200 text-xs bg-stone-50/50">
          <p className="text-stone-900 font-medium truncate">{user?.display_name || user?.email}</p>
          <p className="text-stone-500 text-[11px] truncate mt-0.5">{user?.email}</p>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-stone-700 hover:text-red-600 bg-stone-100 hover:bg-red-50 border border-stone-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <p className="text-sm font-medium text-stone-800">
              {user?.display_name || user?.email}
              {roleLabel ? (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-normal bg-stone-100 text-stone-600 border border-stone-200">
                  {roleLabel}
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">
              Dashboard
            </Link>
            <div className="h-4 w-px bg-stone-200" />
            <button
              type="button"
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer shadow-sm"
              title="Sign out of Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>);
}
