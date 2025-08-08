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
 *     tags:
 *       - Menu List
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
 * /api/user/{valueID}:
 *   get:
 *     summary:
 *     description: Get user information by EmailID or MobileNo
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: valueID
 *         required: true
 *         schema:
 *           type: string
 *         description: EmailID or MobileNo of the user to retrieve
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// GET API to fetch user list
// app.get('/api/user/:userID', async (req, res) => {
//   const userID = parseInt(req.params.userID);

//   if (isNaN(userID)) {
//     return res.status(400).json({statusCode: 400 ,data: {}, error: 'Invalid user ID' });
//   }
//   try {
//     const result = await pool.query('SELECT * FROM getuserslist($1)',[userID]);
//     if (result.rows.length == 0) {
//       return res.status(200).json({statusCode: 400 ,data: {}, error: 'User not found' });
//     }
//     res.status(200).json({statusCode: 200 ,data: result.rows[0], error: '' });
//   } 
//   catch (error) {
//     console.error('Error fetching user:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

app.get('/api/user/:valueID', async (req, res) => {
  const valueID = req.params.valueID?.trim();

  if (!valueID) {
    return res.status(400).json({
      statusCode: 400,
      data: {},
      error: 'Missing valueID (email or mobile number)',
    });
  }

  try {
    // Decide query type: mobile or email
    let query;
    if (/^[6-9]\d{9}$/.test(valueID) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valueID)) {
      query = 'SELECT * FROM getuserslist($1)'; // expects mobile and email in DB
    }
    else {
      return res.status(400).json({
        statusCode: 400,
        data: {},
        error: 'Invalid email or mobile number format',
      });
    }

    const result = await pool.query(query, [valueID]);

    if (result.rows.length == 0) {
      return res.status(200).json({
        statusCode: 400,
        data: {},
        error: 'User not found',
      });
    }

    res.status(200).json({
      statusCode: 200,
      data: result.rows[0],
      error: '',
    });
  } 
  catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({statusCode: 500, data: {}, error: 'Internal Server Error' });
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

  try{
    // Simulate insertion (in real app, insert into DB here)
    const newUser = {
      userName,
      userMobileNo,
      otp,
      token,
      email: email || null,
    };
  
    console.log('User inserted:', newUser);
  
    return res.status(200).json({statusCode: 200 ,message: 'User data inserted successfully', data: newUser });
  }
  catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
app.listen(port, () => {
  //console.log(`Server is running on http://localhost:${port}`);
  console.log(`🚀 Server running at ${process.env.NODE_ENV == 'production' ? process.env.PROD_API_URL : 'http://localhost:' + port}`);
});

//Filllist api
//cart insert and get api
//addressdtl insert and get api