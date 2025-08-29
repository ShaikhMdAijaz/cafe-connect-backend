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
    //res.json(result.rows);
    res.status(200).json({ statusCode: 200, data: result.rows, error: '' });
  }
  catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ statusCode: 500, error: error });
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
      statusCode: 400, data: {}, error: 'Missing valueID (email or mobile number)',
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
        statusCode: 400, data: {}, error: 'Invalid email or mobile number format',
      });
    }

    const result = await pool.query(query, [valueID]);

    if (result.rows.length == 0) {
      return res.status(200).json({
        statusCode: 400, data: {}, error: 'User not found', result: result
      });
    }

    res.status(200).json({
      statusCode: 200, data: result.rows[0], error: '',
    });
  }
  catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ statusCode: 500, data: {}, error: error });
  }
});

//POST API to insert data into table
/**
 * @swagger
 * /api/login:
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

app.post('/api/login', async (req, res) => {
  const { userName, userMobileNo, otp, token, email } = req.body;

  if (!userName || !userMobileNo || !otp || !token) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Simulate insertion (in real app, insert into DB here)
    // const newUser = {
    //   userName,
    //   userMobileNo,
    //   otp,
    //   token,
    //   email: email || null,
    // };

    const result = await pool.query(
      `SELECT * FROM insertuser($1,$2,$3,$4,$5)`, [userName, userMobileNo, otp, token, email]
    );

    if ((result.rows[0].errorMsg != '' && result.rows[0].errorMsg != null) || result.rows[0].id == 0) {
      return res.status(200).json({ statusCode: 400, data: {}, error: result.rows[0].errorMsg, result: result });
    }
    return res.status(200).json({ statusCode: 200, message: 'User data inserted successfully', data: result.rows[0], error: '' });
    //console.log('User inserted:', newUser);  
    //return res.status(200).json({statusCode: 200 ,message: 'User data inserted successfully', data: newUser });
  }
  catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ statusCode: 500, error: error });
  }
});

//Filllist
/**
 * @swagger
 * /api/state/filllist:
 *   get:
 *     summary:
 *     description:
 *     tags:
 *       - Filllist
 *     responses:
 *       200:
 *         description: List of states list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
app.get('/api/state/filllist', async (req, res) => {
  try {
    //const status = req.query.status || 1;
    const result = await pool.query('SELECT * FROM getfilllist()');
    //res.json(rows);
    if (result.rows.length == 0) {
      return res.status(200).json({
        statusCode: 400, data: {}, error: 'States list not found', result: result
      });
    }
    res.status(200).json({ statusCode: 200, data: result.rows, error: '', result: result });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, data: {}, error: err });
  }
});

//GET API to fetch useraddressdtl
/**
 * @swagger
 * /api/user/address/{userID}:
 *   get:
 *     summary: 
 *     description: 
 *     tags:
 *       - User Address
 *     parameters:
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of user addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Server error
 */
app.get('/api/user/address/:userID', async (req, res) => {
  const { userID } = req.params;

  if (!userID || isNaN(userID)) {
    return res.status(200).json({ statusCode: 400, data: {}, error: 'Invalid user ID' });
  }

  try {
    const result = await pool.query(`SELECT * FROM getusersaddressdtl($1)`, [userID]);
    if (result.rows.length == 0) {
      return res.status(200).json({
        statusCode: 400, data: {}, error: 'User Address not found', result: result
      });
    }
    res.status(200).json({ statusCode: 200, data: result.rows, error: '', });
  }
  catch (err) {
    console.error('Error fetching user address:', err);
    res.status(500).json({ statusCode: 500, data: {}, error: err });
  }
});

//GET API to fetch usercartdtl
/**
 * @swagger
 * /api/user/cart/{userID}:
 *   get:
 *     summary:
 *     description:
 *     tags:
 *       - User Cart
 *     parameters:
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: 
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Internal server error
 */
app.get('/api/user/cart/:userID', async (req, res) => {
  const { userID } = req.params;
  if (!userID || isNaN(userID)) {
    return res.status(200).json({ statusCode: 400, data: {}, error: 'Invalid user ID' });
  }
  try {
    const result = await pool.query('SELECT * FROM getuserscartlist($1)', [userID]);
    if (result.rows.length == 0) {
      return res.status(200).json({
        statusCode: 400, data: {}, error: 'User Cart not found', result: result
      });
    }
    res.status(200).json({ statusCode: 200, data: result.rows, error: '', });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, data: {}, error: err });
  }
});

//POST API for UserCartDtl
/**
 * @swagger
 * /api/users/cart:
 *   post:
 *     summary:
 *     description:
 *     tags: 
 *        - User Cart 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: integer
 *               menuID:
 *                 type: integer
 *               type:
 *                 type: string
 *               subType:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               rate:
 *                 type: integer
 *               qty:
 *                 type: integer
 *               image:
 *                 type: string
 *               seqNo:
 *                 type: integer
 *             required:
 *               - userID
 *               - menuID
 *               - type
 *               - subType
 *               - code
 *               - description
 *               - rate
 *               - qty
 *               - image
 *     responses:
 *       200:
 *         description: Insert result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                 usersCartDtlID:
 *                   type: integer
 */
app.post('/api/users/cart', async (req, res) => {
  const { userID, menuID, type, subType, code, description, rate, qty, image, seqNo, } = req.body;
  if ((!userID || isNaN(userID)) || (!menuID || isNaN(menuID)) || !type || !subType || !code || !description || (!rate || isNaN(rate)) || (!qty || isNaN(qty)) || !image) {
    return res.status(400).json({ statusCode: 400, error: 'Missing required fields' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM insertuserscartdtl($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [userID, menuID, type, subType, code, description, rate, qty, image, seqNo]
    );

    //res.json(result.rows[0]); // Will return { errorMsg, usersCartDtlID }    
    if ((result.rows[0].errorMsg != '' && result.rows[0].errorMsg != null) || result.rows[0].usersCartDtlID == 0) {
      return res.status(200).json({ statusCode: 400, data: {}, error: result.rows[0].errorMsg, result: result });
    }
    return res.status(200).json({ statusCode: 200, message: 'User Cart inserted successfully', data: result.rows[0], error: '' });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, data: {}, error: err });
  }
});

//PATCH API for UserCartDtl
/**
 * @swagger
 * /api/users/cart/{id}:
 *   patch:
 *     summary:
 *     tags: [User Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: integer
 *               menuID:
 *                 type: integer
 *               type:
 *                 type: string
 *               subType:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               rate:
 *                 type: integer
 *               qty:
 *                 type: integer
 *               image:
 *                 type: string
 *               seqNo:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cart updated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
app.patch("/api/users/cart/:id", async (req, res) => {
  const { id } = req.params;
  const { userID, menuID, type, subType, code, description, rate, qty, image, seqNo } = req.body;

  // Basic validations
  if ((!id || isNaN(id)) || (!userID || isNaN(userID)) || (!menuID || isNaN(menuID)) || !type || !subType || !code || !description || (!rate || isNaN(rate)) || (!qty || isNaN(qty)) || !image || (!seqNo || isNaN(seqNo))) {
    return res.status(400).json({ statusCode: 400, error: 'Missing or invalid required fields' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM updateuserscartdtl($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, userID, menuID, type, subType, code, description, rate, qty, image, seqNo]
    );

    if (result.rows[0].errorMsg != '' && result.rows[0].errorMsg != null) {
      return res.status(200).json({ statusCode: 400, data: {}, error: result.rows[0].errorMsg, result: result });
    }
    return res.status(200).json({ statusCode: 200, message: '"Cart updated successfully', error: '' });
    // if (result.rows[0]?.errorMsg) {
    //   return res.status(400).json({statusCode: 400,error: result.rows[0].errorMsg,data: {}});
    // }
    // return res.status(200).json({statusCode: 200,message: "Cart updated successfully",error: ""});

  } 
  catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({statusCode: 500,data: {},error: err.message || err});
  }
});

//DELETE API for UserCartDtl
/**
 * @swagger
 * /api/users/cart/{id}/{userID}:
 *   delete:
 *     summary:
 *     tags: [User Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description:
 *       - in: path
 *         name: userID
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Cart item(s) deleted successfully
 *       400:
 *         description: Missing or invalid parameters
 *       500:
 *         description: Internal server error
 */
app.delete("/api/users/cart/:id/:userID", async (req, res) => {
  const { id, userID } = req.params;

  if (!id || isNaN(id) || !userID || isNaN(userID)) {
    return res.status(400).json({statusCode: 400,error: "Missing or invalid parameters"});
  }

  try {
    // Call your PL/pgSQL function
    await pool.query(`SELECT deleteuserscartdtl($1, $2)`, [id, userID]);
    return res.status(200).json({ statusCode: 200, message: '', error: '' });
  } 
  catch (err) {
    return res.status(500).json({statusCode: 500,data: {},error: err.message});
  }
});

//POST API for useraddressdtl
/**
 * @swagger
 * /api/users/address:
 *   post:
 *     summary:
 *     tags: [User Address]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: integer
 *                 example: 1
 *               addressType:
 *                 type: string
 *                 example: Home
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               mobileNo:
 *                 type: string
 *                 example: 9876543210
 *               pincode:
 *                 type: string
 *                 example: 400001
 *               houseNo:
 *                 type: string
 *                 example: A-101
 *               area:
 *                 type: string
 *                 example: Andheri East
 *               landmark:
 *                 type: string
 *                 example: Near Mall
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *               isDefaultAddress:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Address added successfully and list returned
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                 usersCartDtlID:
 *                   type: integer
 */
app.post('/api/users/address', async (req, res) => {
  const { userID, addressType, fullName, mobileNo, pincode, houseNo, area, landmark, city, state, isDefaultAddress } = req.body;
  if ((!userID || isNaN(userID)) || !addressType || !fullName || !mobileNo || !pincode || !houseNo || !area || !landmark || !city || !state || !isDefaultAddress) {
    return res.status(400).json({ statusCode: 400, error: 'Missing required fields' });
  }
  try {
    // Insert into UsersAddressDtl
    const result = await pool.query(`
      SELECT * FROM insertusersaddressdtl($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [userID, addressType, fullName, mobileNo, pincode,
      houseNo, area, landmark, city, state, isDefaultAddress ? '1' : '0']
    );

    // Fetch updated list using your function
    //const { rows } = await pool.query(`SELECT * FROM getusersaddressdtl($1)`, [userID]);
    if ((result.rows[0].errorMsg != '' && result.rows[0].errorMsg != null) || result.rows[0].usersAddressDtlID == 0) {
      return res.status(200).json({ statusCode: 400, data: {}, error: result.rows[0].errorMsg, result: result });
    }
    //res.json({success: true,message: "Address added successfully",addresses: rows});
    return res.status(200).json({ statusCode: 200, message: 'Address inserted successfully', data: result.rows[0], error: '' });

  }
  catch (err) {
    //console.error("Error inserting address:", err.message);
    //res.status(500).json({success: false,error: err.message});
    res.status(500).json({ statusCode: 500, data: {}, error: err });
  }
});

//PATCH API for useraddressdtl
/**
 * @swagger
 * /api/users/address/{id}:
 *   patch:
 *     summary: 
 *     tags: [User Address]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: integer
 *               addressType:
 *                 type: string
 *               fullName:
 *                 type: string
 *               mobileNo:
 *                 type: string
 *               pincode:
 *                 type: string
 *               houseNo:
 *                 type: string
 *               area:
 *                 type: string
 *               landmark:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               isDefaultAddress:
 *                 type: boolean
 *               isDelete:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
app.patch("api/users/address/:id", async (req, res) => {
  const { id } = req.params;
  const { userID, addressType, fullName, mobileNo, pincode, houseNo, area, landmark, city, state, isDefaultAddress, isDelete, } = req.body;
  if ((!id || isNaN(id)) || (!userID || isNaN(userID)) || !addressType || !fullName || !mobileNo || !pincode || !houseNo || !area || !landmark || !city || !state || !isDefaultAddress || !isDelete) {
    return res.status(400).json({ statusCode: 400, error: 'Missing required fields' });
  }
  try {
    const result = await pool.query(`
      SELECT * FROM updateusersaddressdtl($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `, [id,userID,addressType,fullName,mobileNo,pincode,houseNo,area,landmark,
      city,state,isDefaultAddress ? '1' : '0', isDelete ? '1' : '0']
    );

    //const { rows } = await pool.query(query, values);

    if (result.rows[0].errorMsg != '' && result.rows[0].errorMsg != null) {
      return res.status(200).json({ statusCode: 400, data: {}, error: result.rows[0].errorMsg, result: result });
    }
    //res.json({success: true,message: "Address added successfully",addresses: rows});
    return res.status(200).json({ statusCode: 200, message: 'Address updated successfully', error: '' });

    // if (rows[0]?.errorMsg) {
    //   return res.status(400).json({ success: false, message: rows[0].errorMsg });
    // }

    // res.json({ success: true, message: "Address updated successfully" });
  }
  catch (err) {
    //console.error("Error updating address:", err);
    res.status(500).json({ statusCode: 500, data: {}, error: err });
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