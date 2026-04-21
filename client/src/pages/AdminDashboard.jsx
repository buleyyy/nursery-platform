import { useEffect, useState } from "react";
import axios from "axios";
import ProductList from "../components/ProductList";
import ProductForm from "../components/ProductForm";

function AdminDashboard() {
  const [products, setProducts] = useState([]);

  const fetchProducts = () => {
    axios.get("http://localhost:3006/api/products")
      .then(res => setProducts(res.data.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>

      <ProductForm refresh={fetchProducts} />
      <ProductList products={products} refresh={fetchProducts} />
    </div>
  );
}

export default AdminDashboard;