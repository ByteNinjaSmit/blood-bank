// ./server/utils/logger.js
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Ensure the 'logs' directory exists
const logDirectory = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
  try {
    fs.mkdirSync(logDirectory, { recursive: true });
    console.log('Log directory created');
  } catch (err) {
    console.error('Failed to create log directory:', err);
  }
}

// Custom format for file logs (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Custom format for console logs (with colors)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} ${level}: ${message}\n${stack}`;
    }
    return `${timestamp} ${level}: ${message}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // Combined log file (all levels)
    new winston.transports.File({
      filename: path.join(logDirectory, 'app.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Info level log file
    new winston.transports.File({
      filename: path.join(logDirectory, 'info.log'),
      level: 'info',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Error level log file
    new winston.transports.File({
      filename: path.join(logDirectory, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Warn level log file
    new winston.transports.File({
      filename: path.join(logDirectory, 'warn.log'),
      level: 'warn',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDirectory, 'exceptions.log'),
      format: fileFormat
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDirectory, 'rejections.log'),
      format: fileFormat
    })
  ]
});

// Create convenience methods for different log levels
logger.info = (message, meta = {}) => {
  logger.log('info', message, meta);
};

logger.error = (message, meta = {}) => {
  logger.log('error', message, meta);
};

logger.warn = (message, meta = {}) => {
  logger.log('warn', message, meta);
};

logger.debug = (message, meta = {}) => {
  logger.log('debug', message, meta);
};

logger.verbose = (message, meta = {}) => {
  logger.log('verbose', message, meta);
};

module.exports = logger;