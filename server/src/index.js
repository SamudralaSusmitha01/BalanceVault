import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { requestLogger, errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import kycRoutes from './routes/kycRoutes.js';
import ledgerRoutes from './routes/ledgerRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security & Parsing Middlewares
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);
app.use(rateLimiter());

// Mount System Routes (Health & Ready probes)
app.use(systemRoutes);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/audit', auditRoutes);

// Serve static frontend build in production
const publicDir = path.resolve(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path === '/health' || req.path === '/ready') {
      return next();
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'BalanceVault API',
      status: 'UP',
      health: '/health',
      ready: '/ready',
      message: 'Backend API is running. Run npm run build to compile the React frontend.'
    });
  });
}

// 404 Handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'ENDPOINT_NOT_FOUND',
    message: `API endpoint ${req.method} ${req.originalUrl} does not exist.`
  });
});

// Centralized Error Handler
app.use(errorHandler);

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(`🚀 BalanceVault API running on port ${config.port}`);
  console.log(`   Health check: http://localhost:${config.port}/health`);
  console.log(`   Readiness:    http://localhost:${config.port}/ready`);
  console.log(`   Environment:  ${config.env}`);
  console.log('====================================================');
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`\nReceived ${signal}. Gracefully terminating BalanceVault server...`);
  server.close(() => {
    console.log('BalanceVault HTTP server closed cleanly.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
