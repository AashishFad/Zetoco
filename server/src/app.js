/**
 * Express Application Configuration
 */
const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const app = express();

// Enable CORS with frontend client origin
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching client url
      if (!origin || origin === config.clientUrl || config.isDevelopment) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Standard JSON and URL-encoded body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount main API routes
app.use('/api', apiRoutes);

const path = require('path');
const fs = require('fs');

const clientDist = path.resolve(__dirname, '../../client/dist');

// Serve client-side static build and handle SPA routing
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // SPA fallback for all frontend routes (excluding /api)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // Standalone API info when frontend build is absent
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'FlowSync Server is running. Visit /api/health for system status.',
    });
  });
}

// Handle 404 for unhandled API routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
