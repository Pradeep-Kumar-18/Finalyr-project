const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { startPeriodicCleanup } = require('./services/cleanupService');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const auth = require('./routes/authRoutes');
const scans = require('./routes/scanRoutes');
const profile = require('./routes/profileRoutes');
const notifications = require('./routes/notificationRoutes');
const reports = require('./routes/reportRoutes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// ========================
// Security & Performance Middleware
// ========================

// Parse JSON bodies (limit to prevent abuse)
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Enable CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://finalyr-project.vercel.app'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    callback(null, true); // Allow all for now; restrict in production
  },
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Production: log minimal request info
  app.use(morgan(':method :url :status :response-time[0]ms'));
}

// ========================
// Request logging middleware
// ========================
app.use((req, res, next) => {
  // Log all POST requests to scan endpoints
  if (req.method === 'POST' && req.originalUrl.includes('/scans')) {
    logger.info('HTTP', `Incoming scan request: ${req.method} ${req.originalUrl}`);
  }
  next();
});

// ========================
// Mount Routers
// ========================
app.use('/api/auth', auth);
app.use('/api/scans', scans);
app.use('/api/profile', profile);
app.use('/api/notifications', notifications);
app.use('/api/reports', reports);

// ========================
// Health Check / Status Endpoint
// ========================
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'HemoVision AI API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  const cnnService = require('./services/cnnService');
  res.json({
    status: 'healthy',
    uptime: Math.round(process.uptime()),
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    },
    aiQueue: cnnService.getQueueStatus()
  });
});

// ========================
// Error Handler (must be last middleware)
// ========================
app.use(errorHandler);

// ========================
// Start Server
// ========================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info('Server', `HemoVision AI API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  
  // Start periodic file cleanup service
  startPeriodicCleanup();
});

// ========================
// Graceful Shutdown & Crash Prevention
// ========================

// Handle unhandled promise rejections (prevents server crash)
process.on('unhandledRejection', (err) => {
  logger.fatal('Process', `Unhandled Promise Rejection: ${err.message}`, err.stack);
  // Don't crash the server for unhandled rejections
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.fatal('Process', `Uncaught Exception: ${err.message}`, err.stack);
  // Graceful shutdown: close server, then exit
  server.close(() => {
    process.exit(1);
  });
  // Force exit after 10s if server.close hangs
  setTimeout(() => process.exit(1), 10000);
});

// Handle SIGTERM (Render sends this on redeploy)
process.on('SIGTERM', () => {
  logger.info('Process', 'SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process', 'Server closed. Exiting.');
    process.exit(0);
  });
});
