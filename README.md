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
- 🔑 **Password Recovery**: Forgot password dengan email verification
- 🛒 **Complete Checkout Flow**: Sistem checkout lengkap dengan detail pembeli
- 👤 **Mitra Profiles**: Halaman profil mitra dengan informasi lengkap
- 📊 **Analytics Dashboard**: Dashboard analitik untuk mitra dan admin

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local atau cloud)
- Git
- Mailpit (untuk email testing) - opsional

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

4. **Setup Email (Opsional)**
   - Install Mailpit untuk testing email: https://mailpit.axllent.org/
   - Atau gunakan SMTP Gmail untuk production

5. **Access Application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000/api
   - **Mailpit Web Interface**: http://localhost:8025 (jika menggunakan Mailpit)
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
│   │   │   │   ├── edit/[slug]/
│   │   │   │   └── analytics/
│   │   │   ├── notifications/
│   │   │   ├── orders/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   └── withdrawals/
│   │   ├── events/             # Public event pages
│   │   │   ├── page.tsx        # Event listing
│   │   │   └── [slug]/         # Event detail with slug
│   │   ├── checkout/[id]/      # Checkout page with order ID
│   │   ├── mitra/[slug]/       # Mitra profile pages
│   │   ├── my-orders/
│   │   ├── my-tickets/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── DashboardLayout.tsx # Role-based sidebar navigation
│   │   ├── EventCard.tsx
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts             # Axios configuration
│   │   ├── auth.ts            # Authentication helpers
│   │   ├── events-api.ts      # Event API functions
│   │   ├── mitra-api.ts       # Mitra API functions
│   │   ├── formatters.ts      # Date & currency formatters
│   │   └── utils.ts
│   └── public/                # Static assets
│
└── backend/                    # Express.js API
    ├── config/
    │   └── db.js              # MongoDB connection
    ├── controllers/
    │   ├── adminController.js # Admin dashboard & management
    │   ├── authController.js  # Authentication & password reset
    │   ├── eventController.js # Event CRUD operations
    │   ├── notificationController.js # Email notifications
    │   ├── orderController.js # Order management & checkout
    │   ├── paymentController.js # Midtrans payment integration
    │   ├── promoCodeController.js # Promo code management
    │   ├── settingsController.js # App settings
    │   └── withdrawalController.js # Mitra withdrawal requests
    ├── middleware/
    │   ├── auth.js            # JWT authentication
    │   └── ...
    ├── models/
    │   ├── Event.js           # Event schema with validation
    │   ├── Notification.js    # Notification schema
    │   ├── Order.js           # Order schema
    │   ├── PromoCode.js       # Promo code schema
    │   ├── Settings.js        # Settings schema
    │   ├── Ticket.js          # Ticket schema
    │   ├── User.js            # User schema with roles
    │   ├── Withdrawal.js      # Withdrawal schema
    │   └── ...
    ├── routes/
    │   ├── admin.js           # Admin management routes
    │   ├── auth.js            # Authentication routes
    │   ├── events.js          # Event routes
    │   ├── notifications.js   # Notification routes
    │   ├── orders.js          # Order routes
    │   ├── payments.js        # Payment routes
    │   ├── promocodes.js      # Promo code routes
    │   ├── settings.js        # Settings routes
    │   ├── tickets.js         # Ticket routes
    │   └── withdrawals.js     # Withdrawal routes
    ├── utils/
    │   ├── emailService.js    # Email service with Mailpit
    │   └── eventValidator.js  # Event validation logic
    ├── seed.js                # Database seeding script
    ├── update-slugs.js        # Slug migration script
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

## 📧 Email System

### Email Service Features
- **Mailpit Integration**: Testing email dengan web interface
- **SMTP Fallback**: Gmail SMTP untuk production
- **Console Logging**: Development mode tanpa email server
- **HTML Templates**: Template email responsif dan modern
- **Auto Retry**: Mekanisme retry untuk pengiriman email

### Email Templates
- Password reset codes
- Email verification
- Order confirmations
- Event notifications
- Admin notifications

### Setup Email Testing
```bash
# Install Mailpit (Windows)
# Download dari: https://mailpit.axllent.org/

# Atau gunakan Docker
docker run -d -p 1025:1025 -p 8025:8025 --name mailpit axllent/mailpit

# Access web interface
# http://localhost:8025
```

---

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with code
- `GET /api/auth/verify-email` - Verify email address
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Events
- `GET /api/events` - Get all events (public)
- `GET /api/events/:slug` - Get event details by slug
- `POST /api/events` - Create event (mitra only)
- `PUT /api/events/:slug` - Update event (mitra only)
- `DELETE /api/events/:slug` - Delete event (mitra only)
- `GET /api/events/my-events` - Get mitra's events

### Orders & Checkout
- `GET /api/orders/my-orders` - Get user orders
- `POST /api/orders` - Create order (initial)
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order buyer details
- `PUT /api/orders/:id/pay` - Mark order as paid

### Admin Only
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/events` - Get events for moderation
- `PUT /api/admin/events/:id/approve` - Approve event
- `PUT /api/admin/events/:id/reject` - Reject event
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/analytics` - Get platform analytics

### Mitra Features
- `GET /api/mitra/profile/:slug` - Get mitra profile
- `GET /api/mitra/events/:slug` - Get mitra's events
- `GET /api/mitra/stats/:slug` - Get mitra statistics

### Tickets
- `GET /api/tickets/my-tickets` - Get user tickets
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id/validate` - Validate ticket (admin/mitra)

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
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/nesavent

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=24h

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false

# Email Configuration (Development - Mailpit)
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@nesavent.com

# Email Configuration (Production - Gmail SMTP)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5000000
UPLOAD_PATH=./uploads
```

---

## 🎯 Development Workflow

### Sample Accounts (from seed data)

**Admin Account:**
```
Email: admin@nesavent.com
Password: password123
Access: Full admin dashboard (/dashboard) with user management, event moderation, order oversight
```

**Mitra Accounts (15 total):**
```
Email: mitra1@nesavent.com - mitra15@nesavent.com
Password: password123
Access: Mitra dashboard (/dashboard) with event creation, analytics, order management
```

**User Accounts (30 total):**
```
Email: mhs1@nesavent.com - mhs30@nesavent.com
Password: password123
Access: Public pages, event browsing, ticket purchasing, order history
```

### Testing Complete Flow

1. **User Registration & Login**
   - Register new account or use seeded accounts
   - Test forgot password functionality

2. **Event Creation (Mitra)**
   - Login as mitra (mitra1@nesavent.com)
   - Create new event with multiple ticket types
   - Wait for admin approval or login as admin to approve

3. **Event Browsing & Purchasing (User)**
   - Login as user (mhs1@nesavent.com)
   - Browse events and select tickets
   - Complete checkout process
   - View orders in dashboard

4. **Admin Moderation**
   - Login as admin (admin@nesavent.com)
   - Moderate pending events
   - Manage users and orders
   - View platform analytics

5. **Email Testing**
   - Test forgot password flow
   - Check emails in Mailpit web interface (http://localhost:8025)

---

## 📊 Database Models

### User Model
```javascript
{
  nama: String,
  slug: String, // unique URL slug
  email: String,
  password: String, // bcrypt hashed
  nomorTelepon: String,
  role: ['admin', 'mitra', 'mahasiswa', 'user'],
  organisasi: String, // for mitra
  avatar: String,
  isVerified: Boolean,
  verificationCode: String,
  resetPasswordCode: String,
  createdAt: Date
}
```

### Event Model
```javascript
{
  nama: String,
  slug: String, // unique URL slug
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
    deskripsi: String,
    maxPembelianPerOrang: Number,
    mulaiJual: Date,
    akhirJual: Date,
    allowedRoles: [String]
  }],
  gambar: String,
  penyelenggara: String,
  status: ['draft', 'pending', 'approved', 'rejected', 'aktif', 'selesai'],
  validationScore: Number,
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
    tipeTiket: String,
    namaTipe: String,
    hargaSatuan: Number,
    jumlah: Number,
    subtotal: Number
  }],
  totalHarga: Number,
  namaPembeli: String, // optional initially
  emailPembeli: String, // optional initially
  nomorTelepon: String, // optional initially
  status: ['pending', 'paid', 'cancelled', 'expired'],
  paymentToken: String,
  transactionId: String,
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
npm run update-slugs # Update existing records with slugs
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
4. Configure Gmail SMTP for email
5. Deploy to cloud platform (Vercel, Railway, Heroku, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Deploy to Vercel, Netlify, or similar platform

### Production Email Setup
```env
# Production Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Email not sending in development**
   - Start Mailpit: `docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit`
   - Or check console logs for email content

2. **Login issues**
   - Run `npm run seed` to create sample users
   - Check password hashing in User model

3. **Event validation errors**
   - Buyer details are now optional during order creation
   - Fill them during checkout process

4. **MongoDB connection issues**
   - Check MONGO_URI in .env file
   - Ensure MongoDB is running

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
