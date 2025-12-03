# NESAVENT Backend - Production Optimization Guide

## Overview
This document outlines all production-grade optimizations implemented in the NESAVENT backend system, including Redis caching, rate limiting, logging, security enhancements, and validation.

## Table of Contents
1. [Redis Integration](#redis-integration)
2. [Rate Limiting](#rate-limiting)
3. [Logging System](#logging-system)
4. [Input Validation](#input-validation)
5. [Security Enhancements](#security-enhancements)
6. [Performance Optimizations](#performance-optimizations)
7. [Setup Instructions](#setup-instructions)
8. [Testing](#testing)

---

## Redis Integration

### Purpose
- Distributed caching for scalability
- Rate limiting persistence across server restarts
- Session management (future use)

### Implementation
File: `backend/utils/cache.js`

```javascript
const RedisCache = require('./utils/cache');
const cache = new RedisCache();
```

### Cache Usage Examples

#### Storing Data
```javascript
await cache.set('key', value, 300); // TTL 300 seconds
```

#### Retrieving Data
```javascript
const data = await cache.get('key');
```

#### Cache Invalidation
```javascript
await cache.invalidatePattern('events:*'); // Clear all event caches
```

#### Atomic Operations
```javascript
const visits = await cache.increment('page:visits', 1);
const wasSet = await cache.setNX('lock:order:123', 'processing', 60);
```

### Configuration
Environment variables in `.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=nesavent:
```

### Redis Setup

#### Development (Local)
1. Install Redis:
   - Windows: Download from https://redis.io/download or use WSL
   - Mac: `brew install redis`
   - Linux: `sudo apt-get install redis-server`

2. Start Redis:
   ```bash
   redis-server
   ```

3. Verify connection:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

#### Production
Use managed Redis services:
- **AWS ElastiCache**
- **Redis Cloud**
- **Azure Cache for Redis**
- **DigitalOcean Managed Redis**

---

## Rate Limiting

### Purpose
Prevent abuse, DDoS attacks, and ensure fair API usage.

### Implementation
File: `backend/utils/rateLimiter.js`

### Rate Limiter Types

#### 1. API Rate Limiter (General)
- **Limit**: 100 requests per 15 minutes
- **Scope**: All API endpoints
- **Usage**: Applied globally in `server.js`

```javascript
app.use('/api/', apiLimiter);
```

#### 2. Authentication Rate Limiter
- **Limit**: 5 requests per 15 minutes
- **Scope**: Login, register, forgot password
- **Purpose**: Prevent brute force attacks

```javascript
router.post('/login', authLimiter, loginUser);
```

#### 3. Order Creation Rate Limiter
- **Limit**: 10 orders per hour per user
- **Scope**: Order creation endpoint
- **Purpose**: Prevent spam orders

```javascript
router.post('/orders', orderLimiter, createOrder);
```

#### 4. File Upload Rate Limiter
- **Limit**: 20 uploads per hour
- **Scope**: KTM upload, event images
- **Purpose**: Prevent storage abuse

```javascript
router.post('/upload', uploadLimiter, uploadFile);
```

#### 5. Event Creation Rate Limiter
- **Limit**: 5 events per day per mitra
- **Scope**: Event creation endpoint
- **Purpose**: Prevent spam event creation

```javascript
router.post('/events', eventCreationLimiter, createEvent);
```

### Customizing Rate Limits
Edit `backend/utils/rateLimiter.js` to adjust limits:

```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Time window
  max: 5,                    // Max requests
  message: 'Too many login attempts'
});
```

---

## Logging System

### Purpose
- Track application behavior
- Debug issues in production
- Monitor performance
- Audit user actions

### Implementation
File: `backend/utils/logger.js`

### Log Levels
- **error**: Critical errors requiring immediate attention
- **warn**: Warning messages for potential issues
- **info**: General informational messages
- **http**: HTTP request/response logs
- **debug**: Detailed debug information (dev only)

### Log Files
All logs stored in `backend/logs/`:
- `error.log` - Error logs only
- `combined.log` - All logs
- Files auto-rotate daily
- Maximum 14 days retention
- Maximum 20MB per file

### Usage Examples

#### Basic Logging
```javascript
const logger = require('./utils/logger');

logger.info('User registered', { userId, email });
logger.error('Payment failed', { orderId, error });
logger.warn('Low stock alert', { eventId, stock });
```

#### HTTP Request Logging
```javascript
logger.logRequest(req, res, { userId: req.user._id });
```

#### Error Logging with Context
```javascript
try {
  // code
} catch (error) {
  logger.logError(error, req);
}
```

#### Database Query Logging
```javascript
logger.logQuery('Event.find', { kategori: 'Olahraga' }, 245); // 245ms
```

### Monitoring Logs
```bash
# View all logs
tail -f backend/logs/combined.log

# View errors only
tail -f backend/logs/error.log

# Search for specific user activity
grep "userId: 123" backend/logs/combined.log
```

---

## Input Validation

### Purpose
- Prevent SQL/NoSQL injection
- Sanitize user input
- Validate data types and formats
- Provide clear error messages

### Implementation
File: `backend/utils/validators.js`

### Available Validators

#### 1. Registration Validation
```javascript
router.post('/register', validateRegistration, handleValidationErrors, registerUser);
```

Validates:
- Name (3-100 chars, no special chars)
- Email (valid format)
- Password (8+ chars, uppercase, lowercase, number, special char)
- Role (user/mitra)
- Optional: NIM, institution

#### 2. Login Validation
```javascript
router.post('/login', validateLogin, handleValidationErrors, loginUser);
```

Validates:
- Email (valid format)
- Password (not empty)

#### 3. Event Creation Validation
```javascript
router.post('/events', validateEventCreation, handleValidationErrors, createEvent);
```

Validates:
- Event name (required, 3-200 chars)
- Description (required, 10-5000 chars)
- Category (valid enum)
- Date (future date)
- Location (required, 3-200 chars)
- Price (non-negative number)
- Stock (positive integer)

#### 4. Order Creation Validation
```javascript
router.post('/orders', validateOrderCreation, handleValidationErrors, createOrder);
```

Validates:
- Event ID (valid MongoDB ObjectId)
- Quantity (1-10 tickets)
- Payment method (valid enum)

#### 5. Profile Update Validation
```javascript
router.put('/profile', validateProfileUpdate, handleValidationErrors, updateProfile);
```

Validates:
- Name (optional, 3-100 chars)
- Bio (optional, max 500 chars)
- Social media links (optional, valid URLs)

#### 6. Password Change Validation
```javascript
router.put('/password', validatePasswordChange, handleValidationErrors, changePassword);
```

Validates:
- Current password (required)
- New password (8+ chars, complexity requirements)
- Passwords don't match

### Custom Error Handling
All validation errors return:
```json
{
  "errors": [
    {
      "field": "email",
      "message": "Email tidak valid"
    },
    {
      "field": "password",
      "message": "Password harus minimal 8 karakter"
    }
  ]
}
```

### Security Features
- XSS protection: Sanitizes HTML input
- NoSQL injection prevention: Sanitizes MongoDB operators
- Input trimming and normalization
- Case-insensitive email validation

---

## Security Enhancements

### 1. Helmet.js
Adds security headers:
- Content Security Policy (CSP)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- X-XSS-Protection
- Strict-Transport-Security (HTTPS enforcement)

```javascript
app.use(helmet());
```

### 2. CORS Configuration
Whitelist-based CORS:
```javascript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
```

### 3. NoSQL Injection Prevention
```javascript
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());
```

Prevents queries like:
```json
{
  "email": { "$gt": "" },
  "password": { "$ne": null }
}
```

### 4. XSS Protection
Sanitizes HTML input to prevent script injection:
```javascript
const { sanitizeHTML } = require('./utils/validators');
const cleanInput = sanitizeHTML(userInput);
```

### 5. Response Compression
Reduces bandwidth usage:
```javascript
app.use(compression());
```

---

## Performance Optimizations

### 1. Database Indexing

#### Event Model Indexes
```javascript
// Single field indexes
eventSchema.index({ slug: 1 }, { unique: true });
eventSchema.index({ kategori: 1 });
eventSchema.index({ views: -1 });
eventSchema.index({ createdAt: -1 });

// Compound indexes
eventSchema.index({ status: 1, tanggal: 1 });
eventSchema.index({ kategori: 1, status: 1 });
eventSchema.index({ createdBy: 1, status: 1 });

// Text search index
eventSchema.index({ nama: 'text', lokasi: 'text', deskripsi: 'text' });
```

#### User Model Indexes
```javascript
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ slug: 1 }, { unique: true });
userSchema.index({ nim: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ studentVerificationStatus: 1 });
```

#### Order Model Indexes
```javascript
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ event: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: 1 });
orderSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
```

### 2. Query Optimization

#### Event Listing with Cache
```javascript
// Cache key includes all query params
const cacheKey = `events:${JSON.stringify(req.query)}`;
const cachedData = await cache.get(cacheKey);
if (cachedData) return res.json(cachedData);

// ... fetch from database ...

await cache.set(cacheKey, result, 120); // 2 minutes TTL
```

#### Batch Operations
```javascript
// Batch notification creation
const notifications = notificationQueue.map(n => ({
  user: n.userId,
  title: n.title,
  message: n.message
}));
await Notification.insertMany(notifications);
```

### 3. Connection Pooling
MongoDB connection pool size:
```javascript
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  minPoolSize: 2
});
```

### 4. Lazy Loading
Load related data only when needed:
```javascript
// Don't populate by default
const event = await Event.findById(id);

// Populate only when needed
const eventWithCreator = await Event.findById(id).populate('createdBy', 'nama email');
```

---

## Setup Instructions

### Prerequisites
- Node.js 14+
- MongoDB 4.4+
- Redis 6.0+

### Installation

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd nesavent/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Redis**
   ```bash
   # Windows (WSL)
   sudo apt-get install redis-server
   redis-server

   # Mac
   brew install redis
   brew services start redis

   # Linux
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database**
   ```bash
   npm run seed
   ```

6. **Start server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

### Verify Installation

1. **Check Redis connection**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Test API health**
   ```bash
   curl http://localhost:5000/health
   ```

   Should return:
   ```json
   {
     "status": "OK",
     "cache": {
       "connected": true
     }
   }
   ```

---

## Testing

### Manual Testing

#### 1. Test Rate Limiting
```bash
# Should succeed first 5 times, then block
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpass"}'
done
```

#### 2. Test Caching
```bash
# First request (slow - from DB)
time curl http://localhost:5000/api/events

# Second request (fast - from cache)
time curl http://localhost:5000/api/events
```

#### 3. Test Validation
```bash
# Invalid email
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"test","nama":"Test"}'

# Should return validation errors
```

#### 4. Test Security Headers
```bash
curl -I http://localhost:5000/api/events

# Check for:
# X-Frame-Options
# X-Content-Type-Options
# Strict-Transport-Security
```

### Automated Testing (TODO)
```bash
npm test
```

---

## Monitoring

### Application Logs
```bash
# View all logs
tail -f logs/combined.log

# View errors only
tail -f logs/error.log

# Search for specific patterns
grep "ERROR" logs/combined.log
grep "userId: 123" logs/combined.log
```

### Redis Monitoring
```bash
# Connect to Redis CLI
redis-cli

# View all keys
KEYS *

# Monitor real-time commands
MONITOR

# Check memory usage
INFO memory

# View cache hit rate
INFO stats
```

### MongoDB Monitoring
```bash
# Connect to MongoDB
mongosh nesavent

# Check slow queries
db.system.profile.find().limit(10).sort({ millis: -1 }).pretty()

# Check index usage
db.events.aggregate([{ $indexStats: {} }])
```

---

## Production Deployment

### Environment Variables
Set these in production:
```env
NODE_ENV=production
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-redis-password
MONGO_URI=mongodb+srv://...
JWT_SECRET=strong-random-secret
MIDTRANS_IS_PRODUCTION=true
CORS_ORIGIN=https://yourdomain.com
```

### Performance Tuning

1. **Redis Memory**
   ```bash
   # Set max memory policy
   redis-cli CONFIG SET maxmemory-policy allkeys-lru
   ```

2. **MongoDB Optimization**
   - Enable profiling for slow queries
   - Monitor index usage
   - Use read replicas for heavy read workloads

3. **Node.js PM2 Setup**
   ```bash
   npm install -g pm2
   pm2 start server.js -i max
   pm2 save
   pm2 startup
   ```

4. **Nginx Reverse Proxy**
   ```nginx
   upstream backend {
     server localhost:5000;
   }

   server {
     listen 80;
     server_name api.yourdomain.com;

     location / {
       proxy_pass http://backend;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     }
   }
   ```

---

## Troubleshooting

### Redis Connection Issues
```bash
# Check Redis status
redis-cli ping

# Check Redis logs
tail -f /var/log/redis/redis-server.log

# Restart Redis
sudo systemctl restart redis
```

### High Memory Usage
```bash
# Check Redis memory
redis-cli INFO memory

# Clear cache
redis-cli FLUSHDB

# Monitor Node.js memory
node --inspect server.js
```

### Rate Limit Not Working
- Verify Redis connection
- Check rate limiter middleware order in `server.js`
- Ensure Redis store is properly configured

### Validation Errors Not Showing
- Check `handleValidationErrors` middleware is applied
- Verify validator order: `[validator, handleValidationErrors, controller]`
- Check client-side error handling

---

## Changelog

### Version 2.0.0 (Current)
- ✅ Redis integration for caching
- ✅ Redis-backed rate limiting
- ✅ Winston logging system
- ✅ Input validation framework
- ✅ Security enhancements (Helmet, sanitization)
- ✅ Response compression
- ✅ Database indexing
- ✅ Batch notification processing

### Version 1.0.0
- Basic CRUD operations
- JWT authentication
- Midtrans payment integration
- Order management

---

## Contributing
Please read CONTRIBUTING.md for development guidelines.

## License
MIT License - see LICENSE file for details.
