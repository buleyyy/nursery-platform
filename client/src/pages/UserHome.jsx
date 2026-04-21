import { useEffect, useState } from "react";
import axios from "axios";

function UserHome() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3006/api/products")
      .then(res => setProducts(res.data.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>ALI Nursery Store</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {products.map(p => (
          <div key={p.id} style={{ border: "1px solid #ccc", padding: 10 }}>
            <h3>{p.name}</h3>
            <p>Rp {Number(p.price).toLocaleString()}</p>
            <p>{p.category_name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserHome;