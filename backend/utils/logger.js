const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about colors
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports
const transports = [
  // Console transport for development
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'http' : 'debug',
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Stream for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper functions
logger.logRequest = (req, res, responseTime) => {
  logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${responseTime}ms`);
};

logger.logError = (error, req = null) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    ...(req && {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?._id,
    }),
  };
  
  logger.error(JSON.stringify(errorInfo));
};

logger.logQuery = (model, operation, duration, success = true) => {
  const level = success ? 'debug' : 'warn';
  logger[level](`DB Query: ${model}.${operation} - ${duration}ms - ${success ? 'SUCCESS' : 'FAILED'}`);
};

module.exports = logger;
