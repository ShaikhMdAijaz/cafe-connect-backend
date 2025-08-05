const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
// xyz 123
// Load environment variables from .env
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// PostgreSQL DB connection
// const pool = new Pool({
//   user: 'postgres',         // Replace with your DB user
//   host: 'localhost',        // or your DB host
//   database: 'cafe-connect-db', // Replace with your DB name
//   password: 'postgres@25',      // Replace with your DB password
//   port: 5432,               // Default PostgreSQL port
// });

// Setup PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  family: 4
});

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error connecting to the database:', err.stack);
  }
  console.log('✅ Connected to PostgreSQL database!');
  release();
});

// GET API to fetch menu list
app.get('/api/menu', async (req, res) => {
  try {
    //const result = await pool.query('SELECT * FROM "Menu" ORDER BY "SeqNo" ASC');
    //const result = await pool.query('SELECT * FROM get_menu_list() ORDER BY "SeqNo" DESC');
    const result = await pool.query('SELECT * FROM get_menu_list()');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});