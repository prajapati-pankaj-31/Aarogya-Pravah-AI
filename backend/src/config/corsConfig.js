/**
 * CORS Configuration Helper for Express and Socket.IO
 * Supports:
 * - FRONTEND_URL and CLIENT_URL environment variables (single or comma-separated)
 * - Localhost and 127.0.0.1 development ports (3000, 5173, 8080)
 * - Server-to-server / non-browser requests (null origin)
 */

const getNormalizedOrigins = () => {
  const envOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
  ]
    .filter(Boolean)
    .flatMap((urlStr) => urlStr.split(',').map((u) => u.trim().replace(/\/$/, '')));

  const localDefaults = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];

  return Array.from(new Set([...envOrigins, ...localDefaults]));
};

const isOriginAllowed = (origin) => {
  // Allow non-browser requests (curl, Postman, mobile apps, server-to-server)
  if (!origin) return true;

  const normalizedOrigin = origin.trim().replace(/\/$/, '');
  const allowed = getNormalizedOrigins();

  if (allowed.includes(normalizedOrigin)) {
    return true;
  }

  // In non-production environments, remain permissive for local testing
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS Error: Origin ${origin} not allowed by Access-Control-Allow-Origin.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

module.exports = {
  getNormalizedOrigins,
  isOriginAllowed,
  corsOptions,
};
