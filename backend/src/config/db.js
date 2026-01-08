const { Pool, types } = require('pg');
require('dotenv').config();

// Parse NUMERIC(oid=1700) to float
// This ensures that decimal columns from the DB are returned as Javascript numbers, 
// preventing "toFixed is not a function" errors in the frontend.
types.setTypeParser(1700, (val) => parseFloat(val));

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'shopify_wallet',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};