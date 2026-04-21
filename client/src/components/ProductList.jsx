import axios from "axios";

function ProductList({ products, refresh }) {

  const handleDelete = (id) => {
    axios.delete(`http://localhost:3006/api/products/${id}`)
      .then(() => refresh())
      .catch(err => console.error(err));
  };

  return (
    <div>
      <h2>Product List</h2>

      {products.map(p => (
        <div key={p.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <h3>{p.name}</h3>
          <p>Rp {Number(p.price).toLocaleString()}</p>
          <p>{p.category_name}</p>

          <button onClick={() => handleDelete(p.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default ProductList;