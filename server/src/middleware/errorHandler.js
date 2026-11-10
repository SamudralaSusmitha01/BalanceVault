export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health' && req.path !== '/ready') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl || req.url} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
}

export function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack || err.message || err);

  const statusCode = err.statusCode || 500;
  const response = {
    error: err.name || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected server error occurred'
  };

  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
