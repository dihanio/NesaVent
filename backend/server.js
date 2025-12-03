const dotenv = require('dotenv');

// Load environment variables FIRST before any other imports
dotenv.config();

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { initializeOrderExpiryJob } = require('./utils/orderExpiry');
const { apiLimiter } = require('./utils/rateLimiter');
const { sanitizeMongoOperators } = require('./utils/validators');
const cache = require('./utils/cache');
const logger = require('./utils/logger');

// Koneksi ke database
connectDB();

// Initialize cron jobs
initializeOrderExpiryJob();

// Initialize Express
const app = express();

// Trust proxy (important for rate limiting and logging)
app.set('trust proxy', 1);

// Security middleware - Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  } : false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression middleware for response compression
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// CORS middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://10.2.41.139:3000',
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches pattern
    if (allowedOrigins.includes(origin) || 
        /^http:\/\/(192\.168|10\.)\d+\.\d+:3000$/.test(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400, // Cache preflight for 24 hours
}));

// HTTP request logger
app.use(morgan('combined', { stream: logger.stream }));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB operator sanitization (prevent NoSQL injection)
app.use(sanitizeMongoOperators);

// Global rate limiting
app.use(apiLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mitra', require('./routes/mitra'));
app.use('/api/events', require('./routes/events'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payment', require('./routes/payments'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/academic', require('./routes/academic'));
app.use('/api/withdrawals', require('./routes/withdrawals'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));

// Health check route
app.get('/health', async (req, res) => {
  try {
    const cacheStats = await cache.getStats();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      cache: cacheStats,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      message: 'Layanan sedang tidak tersedia'
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Selamat datang di API NESAVENT',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: process.env.API_DOCS_URL || null
    }
  });
});

// 404 handler - must be after all routes
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl} from ${req.ip}`);
  res.status(404).json({
    message: 'Endpoint tidak ditemukan',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler - must be last
app.use((err, req, res, next) => {
  // Log error
  logger.logError(err, req);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validasi gagal',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Format ID tidak valid',
      field: err.path
    });
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const fieldNames = {
      email: 'Email',
      slug: 'Slug',
      nim: 'NIM'
    };
    const displayField = fieldNames[field] || field;
    return res.status(409).json({
      message: `${displayField} sudah terdaftar`,
      field
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Token tidak valid'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token sudah kadaluarsa'
    });
  }
  
  // Rate limit error
  if (err.status === 429) {
    return res.status(429).json({
      message: 'Terlalu banyak permintaan, silakan coba lagi nanti',
      retryAfter: err.retryAfter || '15 menit'
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Terjadi kesalahan server',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
