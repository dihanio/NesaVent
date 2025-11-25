# NESAVENT - Event Ticketing Platform

Website penjualan tiket event dengan Next.js, Express, MongoDB, dan Midtrans.

---

## 🚀 INSTALASI

### 1. Install Frontend (Next.js + TailwindCSS)

```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
npm install axios jwt-decode
```

### 2. Install Backend (Express + MongoDB + JWT + Midtrans)

```bash
cd backend
npm init -y
npm install express mongoose dotenv cors bcryptjs jsonwebtoken
npm install midtrans-client
npm install -D nodemon
```

---

## 📁 STRUKTUR FOLDER

```
nesavent/
├── frontend/                # Next.js App
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── events/
│   │   │   └── [id]/
│   │   ├── checkout/
│   │   ├── my-tickets/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── EventCard.tsx
│   │   └── TicketCard.tsx
│   ├── lib/
│   │   ├── api.ts          # Axios instance
│   │   └── auth.ts         # JWT helper
│   ├── .env.local
│   └── package.json
│
└── backend/                 # Express API
    ├── config/
    │   └── db.js           # MongoDB connection
    ├── models/
    │   ├── User.js
    │   ├── Event.js
    │   ├── Order.js
    │   └── Ticket.js
    ├── routes/
    │   ├── auth.js
    │   ├── events.js
    │   ├── orders.js
    │   └── payments.js
    ├── middleware/
    │   └── auth.js         # JWT verification
    ├── controllers/
    │   ├── authController.js
    │   ├── eventController.js
    │   ├── orderController.js
    │   └── paymentController.js
    ├── .env
    ├── server.js
    └── package.json
```

---

## 📝 FILE WAJIB & FUNGSI

### Frontend
- **app/layout.tsx**: Root layout, Navbar global
- **app/page.tsx**: Homepage, list semua event
- **app/events/[id]/page.tsx**: Detail event + form pembelian
- **app/checkout/page.tsx**: Summary order sebelum bayar
- **app/my-tickets/page.tsx**: Daftar tiket user (setelah bayar)
- **lib/api.ts**: Axios instance dengan base URL + interceptor JWT
- **lib/auth.ts**: Login, register, logout, get user info

### Backend
- **server.js**: Entry point, setup Express + routes
- **config/db.js**: Koneksi ke MongoDB
- **models/User.js**: Schema user (email, password, nama)
- **models/Event.js**: Schema event (nama, tanggal, lokasi, harga, stok)
- **models/Order.js**: Schema order (user, event, jumlah, total, status)
- **models/Ticket.js**: Schema tiket (order, QR code, status validasi)
- **routes/auth.js**: POST /register, /login
- **routes/events.js**: GET /events, GET /events/:id
- **routes/orders.js**: POST /orders (create order)
- **routes/payments.js**: POST /payment/create (Midtrans), POST /payment/callback (webhook)
- **middleware/auth.js**: Verifikasi JWT untuk route protected

---

## 🔄 WORKFLOW PROJECT NESAVENT

### User Flow

1. **Browse Event** → User buka homepage → melihat list event
2. **Detail Event** → Klik event → lihat detail + form pilih jumlah tiket
3. **Checkout** → Isi data → buat order (status: pending)
4. **Payment** → Redirect ke Midtrans → user bayar
5. **Callback** → Midtrans hit webhook → update order status (paid)
6. **Generate Ticket** → Backend generate tiket dengan QR code
7. **My Tickets** → User lihat tiket di dashboard → download/print

### Tech Flow

```
Frontend (Next.js)
    ↓ API Request (JWT in header)
Backend (Express)
    ↓ Verify JWT
    ↓ Process request
MongoDB (Mongoose)
    ↓ Save/Get data
Midtrans API
    ↓ Payment gateway
Webhook Callback
    ↓ Update order status
    ↓ Generate ticket
```

---

## 🌐 ENVIRONMENT VARIABLES

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend (.env)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/nesavent
JWT_SECRET=your_jwt_secret_key_here
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false
```

---

## 🎯 LANGKAH DEVELOPMENT

1. Setup database MongoDB (lokal atau cloud)
2. Jalankan backend: `cd backend && npm run dev`
3. Jalankan frontend: `cd frontend && npm run dev`
4. Buat akun Midtrans Sandbox untuk testing payment
5. Test flow: Register → Login → Browse → Checkout → Payment

---

**Project siap untuk dikembangkan! 🚀**
