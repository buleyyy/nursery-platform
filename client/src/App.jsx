import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import UserHome from "./pages/UserHome";

function App() {
  return (
    <Router>
      <nav style={{ padding: 10, background: "#eee" }}>
        <Link to="/" style={{ marginRight: 10 }}>User</Link>
        <Link to="/admin">Admin</Link>
      </nav>

      <Routes>
        <Route path="/" element={<UserHome />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;