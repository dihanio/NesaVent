# NESAVENT Backend API

Backend API untuk platform penjualan tiket event NesaVent dengan Express.js, MongoDB, dan integrasi Midtrans.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local atau cloud)
- Git

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Configure your environment variables in `.env` file.

4. **Database Seeding**
   ```bash
   npm run seed
   ```
   This will create sample data including admin/mitra/user accounts.

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection configuration
├── controllers/
│   ├── adminController.js # Admin dashboard & management endpoints
│   ├── authController.js  # Authentication (register, login, verify)
│   ├── eventController.js # Event CRUD operations
│   ├── notificationController.js # Email notifications
│   ├── orderController.js # Order management
│   ├── paymentController.js # Midtrans payment integration
│   ├── promoCodeController.js # Promo code management
│   ├── settingsController.js # App settings
│   └── withdrawalController.js # Mitra withdrawal requests
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── models/
│   ├── Event.js           # Event schema
│   ├── Notification.js    # Notification schema
│   ├── Order.js           # Order schema
│   ├── PromoCode.js       # Promo code schema
│   ├── Settings.js        # Settings schema
│   ├── Ticket.js          # Ticket schema
│   ├── User.js            # User schema
│   └── Withdrawal.js      # Withdrawal schema
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
│   ├── eventValidator.js  # Event validation logic
│   └── sendEmail.js       # Email service utility
├── seed.js                # Database seeding script
├── server.js              # Express app entry point
└── package.json
```

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access, user management, event moderation
- **Mitra**: Event organizer, can create/manage events, view analytics
- **User**: Regular user, can browse events, purchase tickets

### JWT Authentication
- Access tokens expire in 24 hours
- Refresh tokens for seamless authentication
- Protected routes use `auth` middleware

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-email` - Verify email address
- `GET /api/auth/me` - Get current user profile

### Events
- `GET /api/events` - Get all events (public)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (mitra only)
- `PUT /api/events/:id` - Update event (mitra only)
- `DELETE /api/events/:id` - Delete event (mitra only)
- `GET /api/events/my-events` - Get mitra's events

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/cancel` - Cancel order

### Payments
- `POST /api/payment/create` - Create Midtrans payment
- `POST /api/payment/notification` - Midtrans webhook
- `GET /api/payment/status/:orderId` - Check payment status

### Admin Only
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/events` - Get events for moderation
- `PUT /api/admin/events/:id/approve` - Approve event
- `PUT /api/admin/events/:id/reject` - Reject event
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/analytics` - Get platform analytics

### Tickets
- `GET /api/tickets/my-tickets` - Get user tickets
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id/validate` - Validate ticket (admin/mitra)

### Withdrawals
- `GET /api/withdrawals` - Get withdrawal requests (mitra)
- `POST /api/withdrawals` - Request withdrawal (mitra)
- `PUT /api/withdrawals/:id/process` - Process withdrawal (admin)
- `PUT /api/withdrawals/:id/reject` - Reject withdrawal (admin)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## 🛡️ Event Validation System

### Validation Rules
- **Content Analysis**: AI-powered content validation
- **Date Validation**: Ensures realistic event dates
- **Location Check**: Validates location authenticity
- **Pricing Analysis**: Detects unusual pricing patterns
- **Organizer Verification**: Checks organizer credibility

### Auto-Moderation
- Events with low validation scores are auto-rejected
- Detailed rejection reasons provided
- Admin can override decisions manually

## 💳 Payment Integration

### Midtrans Integration
- Sandbox and production environments
- Multiple payment methods support
- Webhook notifications for payment status
- Automatic order status updates

### Supported Payment Methods
- Credit/Debit Cards
- Bank Transfer (Virtual Account)
- E-Wallets (GoPay, OVO, DANA)
- Retail Outlets (Alfamart, Indomaret)

## 📧 Email Notifications

### Email Templates
- Welcome emails for new users
- Email verification
- Password reset
- Order confirmations
- Payment notifications
- Event updates
- Ticket delivery

### Email Service
- Configurable SMTP settings
- HTML templates with responsive design
- Automatic retry mechanism
- Delivery status tracking

## 🗄️ Database Models

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
  saldo: Number, // for mitra earnings
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
  gambar: String,
  penyelenggara: String,
  tiketTersedia: [{
    nama: String,
    harga: Number,
    stok: Number,
    stokTersisa: Number,
    deskripsi: String
  }],
  status: ['draft', 'pending', 'approved', 'rejected', 'aktif', 'selesai'],
  createdBy: ObjectId, // reference to User
  validationScore: Number,
  createdAt: Date
}
```

### Order Model
```javascript
{
  user: ObjectId,
  event: ObjectId,
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
  promoCode: String,
  namaPembeli: String,
  emailPembeli: String,
  nomorTelepon: String,
  status: ['pending', 'paid', 'cancelled', 'expired', 'refunded'],
  paymentMethod: String,
  paidAt: Date,
  createdAt: Date
}
```

## ⚙️ Environment Variables

Create a `.env` file in the backend root directory:

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

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@nesavent.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5000000
UPLOAD_PATH=./uploads
```

## 🎯 Sample Data (from seed.js)

### Admin Account
```
Email: admin@nesavent.com
Password: password123
Role: admin
```

### Mitra Account
```
Email: mitra@nesavent.com
Password: password123
Role: mitra
```

### User Account
```
Email: user@nesavent.com
Password: password123
Role: user
```

## 📊 Available Scripts

```bash
npm run dev      # Start development server with nodemon
npm run start    # Start production server
npm run seed     # Seed database with sample data
```

## 🔧 Development Guidelines

### Code Style
- Use ES6+ syntax
- Consistent naming conventions
- Proper error handling
- Input validation on all endpoints

### Security Best Practices
- Password hashing with bcrypt
- JWT token validation
- Input sanitization
- CORS configuration
- Rate limiting (recommended)

### API Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "errors": null
}
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB URI
- [ ] Set `MIDTRANS_IS_PRODUCTION=true`
- [ ] Configure production email settings
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging

### Recommended Hosting
- **Vercel**: For serverless deployment
- **Railway**: Full-stack deployment
- **Heroku**: Traditional hosting
- **AWS/DigitalOcean**: Cloud infrastructure

## 🐛 Troubleshooting

### Common Issues
1. **MongoDB Connection Error**
   - Check MongoDB service is running
   - Verify connection string in `.env`

2. **JWT Token Issues**
   - Ensure `JWT_SECRET` is set
   - Check token expiration

3. **Midtrans Payment Issues**
   - Verify sandbox/production keys
   - Check webhook endpoint accessibility

4. **Email Not Sending**
   - Verify SMTP credentials
   - Check firewall settings

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.</content>
<parameter name="filePath">c:\laragon\www\nesavent\backend\README.md