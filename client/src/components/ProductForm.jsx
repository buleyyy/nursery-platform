import { useState } from "react";
import axios from "axios";

function ProductForm({ refresh }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category_id, setCategory] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.post("http://localhost:3006/api/products", {
      name,
      price,
      category_id
    })
    .then(() => {
      setName("");
      setPrice("");
      setCategory("");
      refresh();
    })
    .catch(err => console.error(err));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Product</h2>

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <select onChange={(e) => setCategory(e.target.value)}>
        <option value="">Category</option>
        <option value="1">Indoor</option>
        <option value="2">Outdoor</option>
      </select>

      <button type="submit">Add</button>
    </form>
  );
}

export default ProductForm;