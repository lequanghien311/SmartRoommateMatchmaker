const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { pool } = require('./database/connection');
const { logger } = require('./shared/providers');
const { initializeRealtime } = require('./modules/chat/chat.routes');

const server = http.createServer(app);
initializeRealtime(server);

server.listen(env.port, '0.0.0.0', () => {
  logger.info('server_started', { port: env.port, environment: env.nodeEnv });
});

async function shutdown(signal) {
  logger.info('server_shutdown', { signal });
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason: reason?.message || String(reason) });
});
process.on('uncaughtException', (error) => {
  logger.error('uncaught_exception', { error: error?.message || String(error) });
});
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

