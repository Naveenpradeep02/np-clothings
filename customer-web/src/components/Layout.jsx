import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  ShoppingBag,
  Heart,
  User,
  LogOut,
  LogIn,
  Info,
  Menu,
  X,
  Compass,
  Phone,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import Footer from './Footer';
import InfoSidebar from './InfoSidebar';

export default function Layout({ children, cartCount = 0 }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const timeout = setTimeout(() => {
      const targets = document.querySelectorAll(
        '.reveal-on-scroll, .reveal-from-left, .reveal-from-right'
      );
      targets.forEach((el) => observer.observe(el));
    }, 60);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Collections' },
    { to: '/about', label: 'Atelier' },
    { to: '/faq', label: 'Bespoke Guide' },
    { to: '/contact', label: 'Concierge' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-stone-900 antialiased flex flex-col font-sans">
      {/* Accessibility skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-stone-900 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Top Quiet Luxury Announcement Bar */}
      <div className="bg-stone-950 text-stone-300 text-[11px] py-1.5 px-4 tracking-widest uppercase border-b border-stone-800 text-center flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] inline-block animate-pulse"></span>
        <span>Complimentary Pan-India Insured Express Shipping &bull; Made-to-Measure Fittings</span>
      </div>

      {/* Main Navigation Header */}
      <header
        className="border-b border-stone-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 transition-shadow duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        role="banner"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-18">
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#c9a96e]"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Brand Monogram Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-lg sm:text-xl font-medium tracking-[0.22em] uppercase text-stone-900 group focus:outline-none"
            aria-label="NP Clothings Home"
          >
            <span className="font-serif text-2xl font-normal text-stone-950 group-hover:text-[#c9a96e] transition-colors">
              NP
            </span>
            <span className="h-4 w-px bg-stone-300"></span>
            <span className="text-xs sm:text-sm font-light tracking-[0.28em] text-stone-600">
              Clothings
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Primary Desktop Navigation"
            className="hidden lg:flex items-center gap-7 text-xs tracking-[0.2em] uppercase font-medium"
          >
            {navLinks.map((item) => {
              const active =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`transition-colors py-1 relative ${
                    active
                      ? 'text-stone-950 font-semibold'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#c9a96e]"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons (Wishlist, Cart, Account, Atelier Drawer) */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Wishlist Link */}
            {user && (
              <Link
                to="/account/wishlist"
                className={`p-2 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors ${
                  location.pathname === '/account/wishlist' ? 'text-stone-900 bg-stone-100' : ''
                }`}
                title="Saved Wishlist"
                aria-label="Wishlist"
              >
                <Heart className="w-4 h-4 stroke-[1.8]" />
              </Link>
            )}

            {/* Shopping Cart Button */}
            <Link
              to="/cart"
              className={`relative flex items-center gap-1.5 p-2 rounded-full text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors ${
                location.pathname === '/cart' ? 'bg-stone-100 text-stone-950 font-medium' : ''
              }`}
              title="Shopping Cart"
              aria-label={`Shopping Cart, ${cartCount} items`}
            >
              <ShoppingBag className="w-4 h-4 stroke-[1.8]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#c9a96e] text-stone-950 font-bold text-[10px] rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account / Sign In */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-stone-200">
                <Link
                  to="/account"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-stone-700 hover:text-stone-950 hover:bg-stone-100 ${
                    location.pathname.startsWith('/account') ? 'bg-stone-100 text-stone-950' : ''
                  }`}
                  title="My Account"
                >
                  <User className="w-4 h-4 text-[#c9a96e] stroke-[1.8]" />
                  <span className="font-medium tracking-normal text-xs capitalize max-w-[100px] truncate">
                    {user.profile?.first_name || user.profile?.display_name || 'Account'}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => logout()}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5 stroke-[1.8]" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-black text-white text-xs tracking-wider uppercase font-medium rounded-lg transition-all shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[1.8]" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Atelier Info Drawer Toggle Button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer border border-stone-200/90 hover:border-stone-400 ml-0.5"
              title="Atelier Info, Address & Concierge"
              aria-label="Open Atelier Info, Address & Concierge"
            >
              <Info className="w-4 h-4 stroke-[1.8] text-[#a37d32]" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white px-6 py-6 shadow-xl animate-page-enter">
            <nav className="flex flex-col space-y-4">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#c9a96e] font-semibold">
                Menu
              </span>
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-serif text-stone-900 hover:text-[#c9a96e] py-1 border-b border-stone-100 transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              <div className="pt-2 flex flex-col gap-2.5">
                {user ? (
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <Link
                      to="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-sm font-medium text-stone-900"
                    >
                      <User className="w-4 h-4 text-[#c9a96e]" />
                      <span>{user.profile?.first_name || 'My Account'}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs text-rose-600 font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 bg-stone-900 text-white rounded-lg text-xs uppercase tracking-widest font-medium"
                  >
                    Sign In to Atelier
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none animate-page-enter" role="main">
        {children}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Global Atelier Drawer */}
      <InfoSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}
