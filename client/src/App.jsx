import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UserLayout  from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

import UserHome      from './pages/UserHome';
import ProductDetail from './pages/ProductDetail';
import Checkout      from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import PaymentInfo   from './pages/PaymentInfo';

import AdminLogin     from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders    from './pages/AdminOrders';
import AdminProducts  from './pages/AdminProducts';
import AdminPayments  from './pages/AdminPayments';

const ProtectedAdmin = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── User Routes ── */}
        <Route path="/" element={<UserLayout><UserHome /></UserLayout>} />
        <Route path="/products/:id" element={<UserLayout><ProductDetail /></UserLayout>} />
        <Route path="/checkout"     element={<UserLayout><Checkout /></UserLayout>} />
        <Route path="/track"        element={<UserLayout><OrderTracking /></UserLayout>} />
        <Route path="/payment/:orderNumber" element={<UserLayout><PaymentInfo /></UserLayout>} />

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
      </Routes>
    </BrowserRouter>
  );
}
