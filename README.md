# NESAVENT - Event Ticketing Platform

Platform penjualan tiket event modern dengan sistem role-based authentication, dashboard admin dan mitra, serta integrasi payment gateway Midtrans.

## ✨ Fitur Utama

- 🔐 **Role-Based Authentication**: Admin, Mitra (Event Organizer), dan User biasa
- 👑 **Admin Dashboard**:
  - Pantau seluruh sistem platform
  - Moderasi event (approve/reject)
  - Manajemen pengguna (ubah role, hapus user)
  - Pantau semua pesanan platform
  - Kelola penarikan dana mitra
- 🎯 **Mitra Dashboard**: Kelola event pribadi, lihat analitik penjualan
- 🎫 **Event Management**: Buat, edit, dan kelola berbagai jenis event
- 💳 **Payment Gateway**: Integrasi Midtrans untuk pembayaran aman
- 📱 **Responsive Design**: UI modern dengan Tailwind CSS
- 🎨 **Multi-Ticket Types**: Sistem tiket dengan berbagai tipe dan harga
- 📧 **Email Notifications**: Notifikasi otomatis untuk berbagai aktivitas
- 🔍 **Advanced Filtering**: Filter dan sorting event berdasarkan status, kategori, dll
- 🛡️ **Event Validation**: Sistem validasi otomatis untuk mencegah event dummy

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local atau cloud)
- Git

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/dihanio/NesaVent.git
   cd nesavent
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure environment variables
   npm run seed         # Seed database with sample data (includes admin/mitra/user accounts)
   npm run dev          # Start development server on port 5000
   ```

3. **Setup Frontend** (in new terminal)
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local  # Configure environment variables
   npm run dev          # Start development server on port 3000
   ```

4. **Access Application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000/api
   - **Admin Dashboard**: Login as admin → navigate to dashboard
   - **Mitra Dashboard**: Login as mitra → navigate to dashboard

---

## 📁 Struktur Project

```
nesavent/
├── frontend/                    # Next.js 16 App Router
│   ├── app/
│   │   ├── (auth)/             # Authentication pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── verify-email/
│   │   ├── dashboard/          # Admin & Mitra dashboard
│   │   │   ├── users/          # Admin: User management
│   │   │   ├── admin-events/   # Admin: Event moderation
│   │   │   ├── admin-orders/   # Admin: Order management
│   │   │   ├── events/         # Mitra: Event management
│   │   │   │   ├── create/
│   │   │   │   ├── edit/
│   │   │   │   └── analytics/
│   │   │   ├── notifications/
│   │   │   ├── orders/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   └── withdrawals/
│   │   ├── events/             # Public event pages
│   │   ├── checkout/
│   │   ├── my-orders/
│   │   ├── my-tickets/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── DashboardLayout.tsx # Role-based sidebar navigation
│   │   ├── EventCard.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts             # Axios configuration
│   │   ├── auth.ts            # Authentication helpers
│   │   ├── formatters.ts      # Date & currency formatters
│   │   └── utils.ts
│   └── public/                # Static assets
│
└── backend/                    # Express.js API
    ├── config/
    │   └── db.js              # MongoDB connection
    ├── controllers/
    │   ├── adminController.js # Admin dashboard & management
    │   ├── authController.js
    │   ├── eventController.js
    │   ├── notificationController.js
    │   ├── orderController.js
    │   ├── paymentController.js
    │   ├── promoCodeController.js
    │   ├── settingsController.js
    │   └── withdrawalController.js
    ├── middleware/
    │   ├── auth.js            # JWT authentication
    │   └── ...
    ├── models/
    │   ├── Event.js
    │   ├── Notification.js
    │   ├── Order.js
    │   ├── PromoCode.js
    │   ├── Settings.js
    │   ├── Ticket.js
    │   ├── User.js
    │   ├── Withdrawal.js
    │   └── ...
    ├── routes/
    │   ├── admin.js           # Admin management routes
    │   ├── auth.js
    │   ├── events.js
    │   ├── notifications.js
    │   ├── orders.js
    │   ├── payments.js
    │   ├── promocodes.js
    │   ├── settings.js
    │   ├── tickets.js
    │   └── withdrawals.js
    ├── utils/
    │   ├── eventValidator.js  # Event validation logic
    │   └── sendEmail.js       # Email service
    ├── seed.js                # Database seeding
    └── server.js              # Express app entry point
```

---

## 🛡️ Event Validation System

Platform ini dilengkapi dengan sistem validasi otomatis untuk mencegah event dummy/palsu:

### Validation Rules
- **Content Analysis**: Deteksi deskripsi yang tidak masuk akal
- **Date Validation**: Pastikan tanggal event realistis
- **Location Check**: Validasi lokasi yang tidak valid
- **Organizer Verification**: Periksa kredibilitas penyelenggara
- **Ticket Pricing**: Deteksi harga yang tidak wajar

### Auto-Rejection Features
- Event dengan skor validasi rendah otomatis ditolak
- Sistem memberikan alasan penolakan yang jelas
- Mitra mendapat notifikasi dengan penjelasan
- Admin dapat melihat detail validasi setiap event

### Manual Moderation
- Admin dapat approve/reject event secara manual
- Sistem memberikan rekomendasi berdasarkan skor validasi
- Alasan penolakan dapat dikustomisasi
- History moderasi tersimpan untuk audit

---

## 🔄 API Endpoints

### Admin Only
- `GET /api/admin/orders` - Get all orders across platform
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/events` - Get all events for moderation
- `PUT /api/admin/events/:id/approve` - Approve event
- `PUT /api/admin/events/:id/reject` - Reject event with reason
- `DELETE /api/admin/events/:id` - Delete event
- `GET /api/admin/withdrawals` - Get withdrawal requests
- `PUT /api/admin/withdrawals/:id/process` - Process withdrawal
- `PUT /api/admin/withdrawals/:id/reject` - Reject withdrawal
- `GET /api/admin/analytics/revenue` - Revenue analytics

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify-email` - Verify email

### Events
- `GET /api/events` - Get all events (public)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (mitra only)
- `PUT /api/events/:id` - Update event (mitra only)
- `DELETE /api/events/:id` - Delete event (mitra only)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details

### Payments
- `POST /api/payments/create` - Create Midtrans payment
- `POST /api/payments/notification` - Midtrans webhook

---

## 🌐 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/nesavent
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false

# Email Configuration (untuk notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@nesavent.com

# Frontend URL (untuk email links)
FRONTEND_URL=http://localhost:3000
```

---

## 🎯 Development Workflow

### 2. Sample Accounts (from seed data)

**Admin Account:**
```
Email: admin@nesavent.com
Password: password123
Access: Full admin dashboard (/dashboard) with user management, event moderation, order oversight
```

**Mitra Account:**
```
Email: mitra@nesavent.com
Password: password123
Access: Mitra dashboard (/dashboard) with event creation, analytics, order management
```

**User Account:**
```
Email: user@nesavent.com
Password: password123
Access: Public pages, event browsing, ticket purchasing, order history
```

**Dashboard Access:**
- Admin: Login → automatically redirected to admin dashboard
- Mitra: Login → automatically redirected to mitra dashboard
- User: Login → redirected to homepage with user menu

### 4. Testing Admin Features
1. Login as admin (`admin@nesavent.com` / `password123`)
2. Access admin dashboard (`/dashboard`)
3. **User Management** (`/dashboard/users`):
   - View all registered users
   - Change user roles using dropdown
   - Delete users with confirmation
   - Filter by role and search by name/email
4. **Event Moderation** (`/dashboard/admin-events`):
   - View pending events requiring approval
   - Approve or reject events with reasons
   - Filter events by status
   - View event details and creator info
5. **Order Management** (`/dashboard/admin-orders`):
   - View all orders across the platform
   - Filter by payment status
   - Search orders by ID, buyer name, or event
6. **Withdrawal Processing** (`/dashboard/withdrawals`):
   - Process pending withdrawal requests
   - Reject withdrawals with reasons
7. View platform analytics and statistics

---

## 📊 Database Models

### User Model
```javascript
{
  nama: String,
  email: String,
  password: String, // hashed
  nomorTelepon: String,
  role: ['admin', 'mitra', 'user'],
  organisasi: String, // for mitra
  isVerified: Boolean,
  createdAt: Date
}
```

### Event Model
```javascript
{
  nama: String,
  deskripsi: String,
  tanggal: Date,
  waktu: String,
  lokasi: String,
  kategori: String,
  tiketTersedia: [{
    nama: String,
    harga: Number,
    stok: Number,
    stokTersisa: Number,
    deskripsi: String
  }],
  gambar: String,
  penyelenggara: String,
  status: ['draft', 'pending', 'approved', 'rejected', 'aktif', 'selesai'],
  createdBy: ObjectId, // reference to User
  createdAt: Date
}
```

### Order Model
```javascript
{
  user: ObjectId, // reference to User
  event: ObjectId, // reference to Event
  items: [{
    tipeTiket: ObjectId,
    namaTipe: String,
    hargaSatuan: Number,
    jumlah: Number,
    subtotal: Number
  }],
  totalHarga: Number,
  discountAmount: Number,
  finalTotal: Number,
  namaPembeli: String,
  emailPembeli: String,
  nomorTelepon: String,
  status: ['pending', 'paid', 'cancelled', 'expired'],
  paidAt: Date,
  createdAt: Date
}
```

---

## 📝 Available Scripts

### Backend
```bash
npm run dev      # Start development server with nodemon
npm run seed     # Seed database with sample data
npm start        # Start production server
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 🚀 Deployment

### Backend Deployment
1. Set environment variables for production
2. Set `MIDTRANS_IS_PRODUCTION=true`
3. Configure MongoDB production URI
4. Deploy to cloud platform (Vercel, Railway, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Deploy to Vercel, Netlify, or similar platform

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For support, email support@nesavent.com or join our Discord community.

---

**Happy coding! 🎉**
