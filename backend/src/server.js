require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/emails');
const updatesRoutes = require('./routes/updates');
const aptRoutes = require('./routes/apt');

const app = express();
const PORT = process.env.PORT || 5000;
const VERSION = process.env.CURRENT_VERSION || '1.0.0';

// Security headers
app.use(helmet());

// CORS
const frontendPort = process.env.FRONTEND_PORT || '3000';
const configuredOrigins = [
  process.env.FRONTEND_URL?.trim(),
  ...(process.env.FRONTEND_URLS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
].filter(Boolean);
const defaultOrigins = [
  `http://localhost:${frontendPort}`,
  `http://127.0.0.1:${frontendPort}`,
  `https://localhost:${frontendPort}`,
  `https://127.0.0.1:${frontendPort}`,
];
const parseOrigin = (value) => {
  try {
    return new URL(value);
  } catch (_err) {
    return null;
  }
};
const allowedOrigins = new Set(
  [...defaultOrigins, ...configuredOrigins]
    .map((origin) => parseOrigin(origin)?.origin)
    .filter(Boolean)
);
const isPrivateIpv4 = (hostname) => {
  const parts = hostname.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) {
    return false;
  }
  const octets = parts.map((part) => Number(part));
  if (octets.some((value) => value > 255)) {
    return false;
  }
  return (
    octets[0] === 10 ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
  );
};
const isAllowedPrivateNetworkOrigin = (parsedOrigin) => {
  if (!parsedOrigin || !['http:', 'https:'].includes(parsedOrigin.protocol)) {
    return false;
  }
  const resolvedPort =
    parsedOrigin.port === '' ? (parsedOrigin.protocol === 'https:' ? '443' : '80') : parsedOrigin.port;
  return isPrivateIpv4(parsedOrigin.hostname) && resolvedPort === frontendPort;
};
app.use(
  cors({
    origin: (origin, callback) => {
      const parsedOrigin = parseOrigin(origin);
      const normalizedOrigin = parsedOrigin?.origin;
      if (
        !origin ||
        (normalizedOrigin && allowedOrigins.has(normalizedOrigin)) ||
        isAllowedPrivateNetworkOrigin(parsedOrigin)
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// HTTP logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    version: VERSION,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/apt', aptRoutes);

// 404 handler
app.use((req, res) => {
  return res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    error: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server after DB sync
if (require.main === module) {
  sequelize
    .sync({ alter: process.env.NODE_ENV === 'development' })
    .then(() => {
      console.log('Database synced successfully.');
      const server = app.listen(PORT, () => {
        console.log(`Email client backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
      });

      // Graceful shutdown
      const shutdown = (signal) => {
        console.log(`\nReceived ${signal}. Shutting down gracefully...`);
        server.close(async () => {
          try {
            await sequelize.close();
            console.log('Database connection closed.');
          } catch (err) {
            console.error('Error closing database:', err);
          }
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    })
    .catch((err) => {
      console.error('Failed to sync database:', err);
      process.exit(1);
    });
}

module.exports = app;
