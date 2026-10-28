import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ShoppingBag, Heart, User, LogOut, LogIn, Info } from 'lucide-react';
import Footer from './Footer';
import InfoSidebar from './InfoSidebar';

export default function Layout({ children, cartCount = 0 }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    // Universal IntersectionObserver for luxury scroll reveals
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -40px 0px',
            }
        );

        // Scan after rendering
        const timeout = setTimeout(() => {
            const targets = document.querySelectorAll('.reveal-on-scroll, .reveal-from-left, .reveal-from-right');
            targets.forEach((el) => observer.observe(el));
        }, 60);

        return () => {
            clearTimeout(timeout);
            observer.disconnect();
        };
    }, [location.pathname]);

    const nav = [
        { to: '/', label: 'Home' },
        { to: '/shop', label: 'Shop' },
        ...(user ? [{ to: '/account/wishlist', label: 'Wishlist', icon: Heart }] : []),
        { to: '/cart', label: `Cart${cartCount ? ` (${cartCount})` : ''}`, icon: ShoppingBag },
    ];
    return (<div className="min-h-screen bg-[#f7f5f2] text-stone-900 antialiased flex flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-stone-900 focus:px-4 focus:py-2 focus:text-white">
        Skip to main content
      </a>

      <header className="border-b border-neutral-200/80 bg-white/90 backdrop-blur sticky top-0 z-20 shadow-xs" role="banner">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-16">
          <Link to="/" className="text-lg sm:text-xl font-medium tracking-[0.2em] uppercase text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400" aria-label="NP Clothings home">
            NP <span className="text-[#c9a96e] font-light">Clothings</span>
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-4 sm:gap-6 text-xs tracking-widest uppercase">
            {nav.map((item) => {
            const active = item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (<Link key={item.to} to={item.to} className={`flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${active ? 'text-stone-900 font-medium' : 'text-stone-500 hover:text-stone-900'}`} aria-current={active ? 'page' : undefined}>
                  {Icon && <Icon className="w-3.5 h-3.5 stroke-[1.8]" />}
                  <span>{item.label}</span>
                </Link>);
            })}

            {user ? (
              <div className="flex items-center gap-3 sm:gap-4 pl-2 border-l border-stone-200">
                <Link
                  to="/account"
                  className={`flex items-center gap-1.5 transition-colors ${
                    location.pathname.startsWith('/account')
                      ? 'text-stone-900 font-semibold'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                  title="My Account"
                >
                  <User className="w-3.5 h-3.5 stroke-[1.8] text-[#c9a96e]" />
                  <span className="normal-case tracking-normal font-medium text-xs">
                    {user.profile?.first_name || user.profile?.display_name || 'Account'}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium tracking-normal normal-case text-stone-500 hover:text-red-600 hover:bg-red-50 border border-stone-200 hover:border-red-200 rounded-md transition-colors cursor-pointer"
                  title="Sign out of account"
                >
                  <LogOut className="w-3 h-3 stroke-[1.8]" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`flex items-center gap-1.5 transition-colors px-3 py-1.5 bg-stone-900 text-white hover:bg-black rounded-md tracking-wider font-medium ${
                  location.pathname === '/login' ? 'ring-2 ring-[#c9a96e]' : ''
                }`}
              >
                <LogIn className="w-3.5 h-3.5 stroke-[1.8]" />
                <span>Sign in</span>
              </Link>
            )}

            {/* Atelier Info Drawer Icon */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer border border-stone-200/80 hover:border-stone-300 ml-1"
              title="Atelier Info, Address & Support"
              aria-label="Atelier Info, Address & Support"
            >
              <Info className="w-4 h-4 stroke-[1.8] text-[#a37d32]" />
            </button>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="outline-none animate-page-enter" role="main">
        {children}
      </main>

      <Footer />
      <InfoSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>);
}
