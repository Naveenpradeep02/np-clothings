import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './components/RequireAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProductsPage from './pages/ProductsPage';
import InventoryPage from './pages/InventoryPage';
import CmsPage from './pages/CmsPage';
import CustomersPage from './pages/CustomersPage';
import CouponsPage from './pages/CouponsPage';
import ReturnsPage from './pages/ReturnsPage';
import SupportPage from './pages/SupportPage';
import CategoriesPage from './pages/CategoriesPage';
import BrandsPage from './pages/BrandsPage';
import VariantSetsPage from './pages/VariantSetsPage';
export default function App() {
    return (<AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />}/>
        <Route element={<RequireAuth>
              <Layout />
            </RequireAuth>}>
          <Route index element={<DashboardPage />}/>
          <Route path="orders" element={<OrdersPage />}/>
          <Route path="orders/:id" element={<OrderDetailPage />}/>
          <Route path="products" element={<ProductsPage />}/>
          <Route path="categories" element={<CategoriesPage />}/>
          <Route path="variants" element={<VariantSetsPage />}/>
          <Route path="brands" element={<BrandsPage />}/>
          <Route path="inventory" element={<InventoryPage />}/>
          <Route path="returns" element={<ReturnsPage />}/>
          <Route path="support" element={<SupportPage />}/>
          <Route path="cms" element={<CmsPage />}/>
          <Route path="customers" element={<CustomersPage />}/>
          <Route path="coupons" element={<CouponsPage />}/>
        </Route>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </AuthProvider>);
}
