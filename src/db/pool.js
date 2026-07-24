const { Pool } = require('pg');
const { env } = require('../config/env');

const shouldUseSsl = env.NODE_ENV === 'production' || Boolean(process.env.RENDER);

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
});

module.exports = { pool };
