// config/db.js (CommonJS)
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing in environment.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

module.exports = { pool };
