const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const staffRoutes = require('./routes/staffRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const queueRoutes = require('./routes/queueRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const ApiResponse = require('./utils/apiResponse');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration - allow flexible frontend connections
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV === 'development' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for hackathon development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// HTTP request logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static directory for uploaded medical images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiter for patient appointment submissions
const appointmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many appointment requests from this IP. Please try again after 15 minutes.',
  },
});

const mongoose = require('mongoose');
const { checkAndConfigureCloudinary } = require('./config/cloudinary');
const { checkModelServiceHealth } = require('./services/imageAnalysisService');

// Comprehensive Health check endpoint
app.get('/api/health', async (req, res) => {
  const cloudinaryConfig = checkAndConfigureCloudinary();
  const mlHealth = await checkModelServiceHealth();

  const mongoState = mongoose.connection.readyState;
  const mongoStatus =
    mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected';

  return ApiResponse.success(res, 'Aarogya Pravah AI Backend API is healthy and running', {
    uptime: process.uptime(),
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    subsystems: {
      mongodb: {
        status: mongoStatus,
        connected: mongoState === 1,
      },
      cloudinary: {
        configured: cloudinaryConfig.isConfigured,
        folder: cloudinaryConfig.cloudinaryFolder,
        cloudName: cloudinaryConfig.cloudName || 'not_configured',
      },
      groqTriage: {
        configured: Boolean(
          process.env.GROQ_API_KEY &&
          process.env.GROQ_API_KEY !== 'your_groq_api_key_here'
        ),
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      },
      mlScreeningService: {
        connected: mlHealth.connected,
        status: mlHealth.status,
        modelLoaded: mlHealth.modelLoaded,
        serviceUrl: mlHealth.serviceUrl,
      },
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', appointmentLimiter, patientRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/ai', aiRoutes);

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
