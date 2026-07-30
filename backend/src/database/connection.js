const { Pool } = require('pg');
const env = require('../config/env');

let databaseUrl = env.databaseUrl;
if (databaseUrl && databaseUrl.includes('%')) {
  try {
    databaseUrl = decodeURIComponent(databaseUrl);
  } catch (_) {}
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

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

