import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import WishlistPage from './pages/WishlistPage';
import AddressesPage from './pages/AddressesPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ShippingPolicyPage from './pages/ShippingPolicyPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import FaqPage from './pages/FaqPage';

export default function App() {
    return (<AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />}/>
        <Route path="/shop" element={<ShopPage />}/>
        <Route path="/product/:idOrSlug" element={<ProductPage />}/>
        <Route path="/cart" element={<CartPage />}/>
        <Route path="/login" element={<LoginPage />}/>
        <Route path="/account" element={<AccountPage />}/>
        <Route path="/account/orders" element={<OrdersPage />}/>
        <Route path="/account/orders/:id" element={<OrderDetailPage />}/>
        <Route path="/account/wishlist" element={<WishlistPage />}/>
        <Route path="/account/addresses" element={<AddressesPage />}/>
        <Route path="/terms" element={<TermsPage />}/>
        <Route path="/privacy" element={<PrivacyPage />}/>
        <Route path="/shipping" element={<ShippingPolicyPage />}/>
        <Route path="/contact" element={<ContactPage />}/>
        <Route path="/about" element={<AboutPage />}/>
        <Route path="/faq" element={<FaqPage />}/>
        <Route path="*" element={<HomePage />}/>
      </Routes>
    </AuthProvider>);
}
