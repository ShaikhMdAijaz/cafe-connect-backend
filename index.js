const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// PostgreSQL DB connection
const pool = new Pool({
  user: 'postgres',         // Replace with your DB user
  host: 'localhost',        // or your DB host
  database: 'cafe-connect-db', // Replace with your DB name
  password: 'postgres@25',      // Replace with your DB password
  port: 5432,               // Default PostgreSQL port
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