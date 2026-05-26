import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/reports/DashboardPage';
import { ProductListPage } from './features/products/ProductListPage';
import { ProductFormPage } from './features/products/ProductFormPage';
import { CategoryListPage } from './features/categories/CategoryListPage';
import { POSCheckoutPage } from './features/sales/POSCheckoutPage';
import { SalesHistoryPage } from './features/sales/SalesHistoryPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { UsersPage } from './features/users/UsersPage';
import { SuppliersPage } from './features/suppliers/SuppliersPage';
import { PurchaseOrdersPage } from './features/purchases/PurchaseOrdersPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:id" element={<ProductFormPage />} />
        <Route path="/categories" element={<CategoryListPage />} />
        <Route path="/sales/new" element={<POSCheckoutPage />} />
        <Route path="/sales" element={<SalesHistoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
