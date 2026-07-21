import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem('customerToken');
    if (!token) { setCustomer(null); setLoading(false); return; }
    try {
      const res = await api.customerMe();
      setCustomer(res.customer);
    } catch (e) {
      localStorage.removeItem('customerToken');
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshMe(); }, [refreshMe]);

  const login = (token, customerData) => {
    localStorage.setItem('customerToken', token);
    setCustomer(customerData);
  };

  const logout = () => {
    localStorage.removeItem('customerToken');
    setCustomer(null);
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, login, logout, refreshMe }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth harus dipakai di dalam CustomerAuthProvider');
  return ctx;
}
