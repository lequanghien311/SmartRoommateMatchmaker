const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const isTest = process.env.NODE_ENV === 'test';
const requiredInProduction = ['DATABASE_URL', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'];

function validateEnvironment() {
  if (process.env.NODE_ENV !== 'production' || isTest) return;
  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${missing.join(', ')}`);
  }
}

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (_) {
    // ignore
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://smart_roommate:local_dev_password@localhost:5432/smart_roommate',
  dbSsl: process.env.DB_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET || 'local-access-secret-at-least-32-characters',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret:
    process.env.REFRESH_TOKEN_SECRET || 'local-refresh-secret-at-least-32-characters',
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  uploadDir,
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024),
  messagingProvider: process.env.MESSAGING_PROVIDER || 'local',
  realtimeProvider: process.env.REALTIME_PROVIDER || 'socketio',
  matchingProvider: process.env.MATCHING_PROVIDER || 'rule-based',
  cacheProvider: process.env.CACHE_PROVIDER || 'memory',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
};

validateEnvironment();
module.exports = env;

