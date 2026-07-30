const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const env = require('./config/env');
const { logger } = require('./shared/providers');
const requestContext = require('./shared/middlewares/requestContext');
const { notFound, errorHandler } = require('./shared/middlewares/errorHandler');

const app = express();
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  }),
);
app.use(cors({ origin: env.corsOrigin.split(',').map((item) => item.trim()), credentials: true }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 180, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(requestContext(logger));

app.use('/uploads', express.static(env.uploadDir, { maxAge: env.nodeEnv === 'production' ? '7d' : 0 }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(YAML.load(path.join(__dirname, 'openapi.yaml'))));
app.use('/api/health', require('./modules/health/health.routes'));
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/users.routes'));
app.use('/api/rooms', require('./modules/rooms/rooms.routes'));
app.use('/api/media', require('./modules/media/media.routes').router);
app.use('/api/amenities', require('./modules/amenities/amenities.routes'));
app.use('/api/favorites', require('./modules/favorites/favorites.routes'));
app.use('/api/roommate-profile', require('./modules/roommate-profiles/roommate-profiles.routes'));
app.use('/api/matches', require('./modules/matching/matching.routes').router);
app.use('/api/conversations', require('./modules/chat/chat.routes').router);
app.use('/api/notifications', require('./modules/notifications/notifications.routes').router);
app.use('/api/reports', require('./modules/reports/reports.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));
app.use('/api/cloud', require('./modules/cloud/cloud.routes'));
require('./config/event-handlers')();

const fs = require('fs');
const frontendCandidates = [
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, '../../frontend'),
  path.resolve(__dirname, '../frontend'),
];
const frontend = frontendCandidates.find((dir) => fs.existsSync(dir)) || path.resolve(__dirname, '../public');

if (fs.existsSync(frontend)) {
  app.use(express.static(frontend));
  app.get(/^\/(?!api(?:\/|$)|uploads(?:\/|$)).*/, (_req, res) => {
    const indexPath = path.join(frontend, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.json({ status: 'ok', service: 'Smart Roommate Matchmaker API' });
    }
  });
} else {
  app.get('/', (_req, res) => res.json({ status: 'ok', service: 'Smart Roommate Matchmaker API' }));
}
app.use(notFound);
app.use(errorHandler);

module.exports = app;
