# 🌿 H. Ali Nursery Platform

Platform manajemen pesanan online untuk UMKM penjualan tanaman hias.

## Struktur Proyek

```
nursery-platform/
│
├── app.js                    # Entry point backend (Express)
├── package.json              # Backend dependencies
├── .env                      # Environment variables
│
├── routes/                   # Backend: API route definitions
│   ├── auth.js               # POST /api/auth/login
│   ├── product.js            # GET /api/products, GET /api/products/:id
│   ├── order.js              # POST /api/orders, GET /api/orders/track
│   └── admin.js              # GET /api/admin/dashboard, dll (protected)
│
├── controllers/              # Backend: Business logic
│   ├── auth.controllers.js
│   ├── product.controllers.js
│   ├── order.controllers.js
│   └── admin.controllers.js
│
├── middleware/               # Backend: Middleware
│   └── auth.js               # JWT verification
│
├── config/                   # Backend: Konfigurasi
│   └── database              # Koneksi database MySQL
│
├── database/                 # SQL schema & migrations
│   └── schema.sql
│
└── client/                   # ── FRONTEND (React + Vite) ──
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx          # React entry point
        ├── App.jsx           # Router & route definitions
        ├── index.css         # Global design system
        │
        ├── layouts/          # Layout wrappers (navbar + footer)
        │   ├── UserLayout.jsx
        │   └── AdminLayout.jsx
        │
        ├── pages/            # Page components (1 per route)
        │   ├── UserHome.jsx
        │   ├── ProductDetail.jsx
        │   ├── Checkout.jsx
        │   ├── OrderTracking.jsx
        │   ├── PaymentInfo.jsx
        │   ├── AdminLogin.jsx
        │   ├── AdminDashboard.jsx
        │   ├── AdminOrders.jsx
        │   ├── AdminProducts.jsx
        │   └── AdminPayments.jsx
        │
        ├── components/       # Shared/reusable UI components
        │   ├── ProductList.jsx
        │   └── ProductForm.jsx
        │
        └── utils/
            └── api.js        # API client + cart helpers + formatters
```

## Setup

### Backend
```bash
npm install
cp .env.example .env   # isi DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET
npm run dev            # http://localhost:3006
```

### Frontend
```bash
cd client
npm install
npm run dev            # http://localhost:5173
```

## Tech Stack
- **Backend**: Node.js, Express, MySQL2, JWT
- **Frontend**: React 19, React Router, Vite
- **Design**: Cormorant Garamond + Geist, Dark Green Theme
