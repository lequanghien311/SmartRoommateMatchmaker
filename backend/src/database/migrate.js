const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const directory = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(directory).filter((name) => name.endsWith('.sql')).sort();
  for (const filename of files) {
    const exists = await pool.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [
      filename,
    ]);
    if (exists.rowCount) continue;
    const sql = fs.readFileSync(path.join(directory, filename), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      console.log(`Applied ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

migrate()
  .catch((error) => {
    const details = error.errors?.map((item) => item.message).join('; ') || error.message || String(error);
    console.error(`Migration thất bại: ${details}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
