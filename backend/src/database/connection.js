const { Pool } = require('pg');
const env = require('../config/env');

let poolConfig = {
  connectionString: env.databaseUrl,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
  max: 10,
};

if (env.databaseUrl) {
  try {
    const rawUrl = env.databaseUrl.includes('://') ? env.databaseUrl : `postgresql://${env.databaseUrl}`;
    const parsed = new URL(rawUrl);
    poolConfig = {
      host: parsed.hostname,
      port: Number(parsed.port || 5432),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
      ssl: (env.dbSsl || parsed.searchParams.get('sslmode') === 'require') ? { rejectUnauthorized: false } : false,
      max: 10,
    };
  } catch (_) {}
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, transaction };

