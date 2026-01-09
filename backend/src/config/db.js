const { Pool, types } = require('pg');
const path = require('path');

// Load .env from the project root (two levels up from this file)
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Parse NUMERIC(oid=1700) to float
// This ensures that decimal columns from the DB are returned as Javascript numbers, 
// preventing "toFixed is not a function" errors in the frontend.
types.setTypeParser(1700, (val) => parseFloat(val));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Log database connection info (without password)
console.log(`Connecting to database: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

module.exports = {
  query: (text, params) => pool.query(text, params),
};