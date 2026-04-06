const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
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
app.use(cors());
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

const path = require('path');

// Set static folder
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes placeholder
app.get('/', (req, res) => {
  res.send('HemoVision AI API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
