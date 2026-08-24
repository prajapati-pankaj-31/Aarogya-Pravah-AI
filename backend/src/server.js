require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const initSocketIO = require('./sockets/socketHandler');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

const { isOriginAllowed } = require('./config/corsConfig');

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Socket.IO CORS Error: Origin ${origin} not permitted.`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 60000,
});

// Setup Socket.IO handlers & emitters
initSocketIO(io);

// Start server listening on 0.0.0.0 for container/cloud platforms
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`========================================================`);
  logger.info(` Aarogya Pravah AI Backend Server running on port ${PORT}`);
  logger.info(` Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(` Health check: http://0.0.0.0:${PORT}/api/health`);
  logger.info(` Socket.IO endpoint active at ws://0.0.0.0:${PORT}`);
  logger.info(`========================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`[Unhandled Rejection] ${err.message}`, { stack: err.stack });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`[Uncaught Exception] ${err.message}`, { stack: err.stack });
});

module.exports = { server, app };
