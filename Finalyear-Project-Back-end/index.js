const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

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

// Middleware
app.use(express.json());

// Enable CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://finalyr-project.vercel.app'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
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
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
app.use('/api/auth', auth);
app.use('/api/scans', scans);
app.use('/api/profile', profile);
app.use('/api/notifications', notifications);
app.use('/api/reports', reports);

app.use(errorHandler);

// Static folder is removed in favor of Cloudinary storage

// Routes placeholder
app.get('/', (req, res) => {
  res.send('HemoVision AI API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
