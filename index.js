const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { swaggerUi, swaggerSpec } = require('./swagger');
// xyz 123
// Load environment variables from .env
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
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

app.get('/', (req, res) => {
  res.send('☕ Cafe Connect API is running!');
});

/**
 * @swagger
 * /api/menu:
 *   get:
 *     summary:
 *     description:
 *     responses:
 *       200:
 *         description: A list of menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// GET API to fetch menu list
app.get('/api/menu', async (req, res) => {
  try {
    //const result = await pool.query('SELECT * FROM "Menu" ORDER BY "SeqNo" ASC');
    //const result = await pool.query('SELECT * FROM get_menu_list() ORDER BY "SeqNo" DESC');
    const result = await pool.query('SELECT * FROM getmenulist()');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/user/{userID}:
 *   get:
 *     summary:
 *     description:
 *      tags:
 *       - User
 *      parameters:
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to retrieve
 *     responses:
 *       200:
 *         description: 
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 */
// GET API to fetch user list
app.get('/api/user/:userID', async (req, res) => {
  const userID = parseInt(req.params.userID);

  if (isNaN(userID)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  try {
    const result = await pool.query('SELECT * FROM getuserslist($1)',[userID]);
    if (result.rows.length == 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } 
  catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//User insert api start
/**
 * @swagger
 * /login:
 *   post:
 *     summary: 
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - userMobileNo
 *               - otp
 *               - token
 *             properties:
 *               userName:
 *                 type: string
 *                 example: 
 *               userMobileNo:
 *                 type: string
 *                 example: 
 *               otp:
 *                 type: string
 *                 example: 
 *               token:
 *                 type: string
 *                 example: 
 *               email:
 *                 type: string
 *                 example: 
 *     responses:
 *       200:
 *         description: User data inserted successfully
 *       400:
 *         description: Missing or invalid parameters
 */

app.post('/login', (req, res) => {
  const { userName, userMobileNo, otp, token, email } = req.body;

  if (!userName || !userMobileNo || !otp || !token) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Simulate insertion (in real app, insert into DB here)
  const newUser = {
    userName,
    userMobileNo,
    otp,
    token,
    email: email || null,
  };

  console.log('User inserted:', newUser);

  return res.status(200).json({ message: 'User data inserted successfully', data: newUser });
});

// Start server
app.listen(port, () => {
  //console.log(`Server is running on http://localhost:${port}`);
  console.log(`🚀 Server running at ${process.env.NODE_ENV == 'production' ? process.env.PROD_API_URL : 'http://localhost:' + port}`);
});