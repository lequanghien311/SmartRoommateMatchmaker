const { randomUUID } = require('crypto');

function requestContext(logger) {
  return (req, res, next) => {
    const started = Date.now();
    req.id = req.get('x-request-id') || randomUUID();
    req.correlationId = req.get('x-correlation-id') || req.id;
    req.logger = logger;
    res.set('x-request-id', req.id);
    res.on('finish', () => {
      logger.info('http_request', {
        requestId: req.id,
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - started,
      });
    });
    next();
  };
}

module.exports = requestContext;

