import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UserLayout  from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import { CustomerAuthProvider, useCustomerAuth } from './context/CustomerAuthContext';

import UserHome      from './pages/UserHome';
import ProductDetail from './pages/ProductDetail';
import Checkout      from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import PaymentInfo   from './pages/PaymentInfo';
import OrderHistory  from './pages/OrderHistory';

import CustomerLogin    from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import ForgotPassword   from './pages/ForgotPassword';
import ResetPassword    from './pages/ResetPassword';

import AdminLogin       from './pages/AdminLogin';
import AdminDashboard   from './pages/AdminDashboard';
import AdminOrders      from './pages/AdminOrders';
import AdminProducts    from './pages/AdminProducts';
import AdminPayments    from './pages/AdminPayments';
import AdminCategories  from './pages/AdminCategories';
import AdminSalesReport from './pages/AdminSalesReport';

const ProtectedAdmin = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" replace />;
};

const ProtectedCustomer = ({ children }) => {
  const { customer, loading } = useCustomerAuth();
  if (loading) return null;
  return customer ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <CustomerAuthProvider>
        <Routes>
          {/* ── User Routes ── */}
          <Route path="/" element={<UserLayout><UserHome /></UserLayout>} />
          <Route path="/products/:id" element={<UserLayout><ProductDetail /></UserLayout>} />
          <Route path="/checkout" element={
            <UserLayout><ProtectedCustomer><Checkout /></ProtectedCustomer></UserLayout>
          } />
          <Route path="/track"        element={<UserLayout><OrderTracking /></UserLayout>} />
          <Route path="/payment/:orderNumber" element={<UserLayout><PaymentInfo /></UserLayout>} />
          <Route path="/my-orders" element={
            <UserLayout><ProtectedCustomer><OrderHistory /></ProtectedCustomer></UserLayout>
          } />

          {/* ── Customer Auth Routes ── */}
          <Route path="/login"            element={<UserLayout><CustomerLogin /></UserLayout>} />
          <Route path="/register"         element={<UserLayout><CustomerRegister /></UserLayout>} />
          <Route path="/forgot-password"  element={<UserLayout><ForgotPassword /></UserLayout>} />
          <Route path="/reset-password"   element={<UserLayout><ResetPassword /></UserLayout>} />

          {/* ── Admin Routes ── */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedAdmin><AdminLayout><AdminDashboard /></AdminLayout></ProtectedAdmin>
          } />
          <Route path="/admin/orders" element={
            <ProtectedAdmin><AdminLayout><AdminOrders /></AdminLayout></ProtectedAdmin>
          } />
          <Route path="/admin/products" element={
            <ProtectedAdmin><AdminLayout><AdminProducts /></AdminLayout></ProtectedAdmin>
          } />
          <Route path="/admin/payments" element={
            <ProtectedAdmin><AdminLayout><AdminPayments /></AdminLayout></ProtectedAdmin>
          } />
          <Route path="/admin/categories" element={
            <ProtectedAdmin><AdminLayout><AdminCategories /></AdminLayout></ProtectedAdmin>
          } />
          <Route path="/admin/sales-report" element={
            <ProtectedAdmin><AdminLayout><AdminSalesReport /></AdminLayout></ProtectedAdmin>
          } />
        </Routes>
      </CustomerAuthProvider>
    </BrowserRouter>
  );
}
