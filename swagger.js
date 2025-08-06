const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Load environment variables
require('dotenv').config();

const isProduction = process.env.NODE_ENV == 'production';

const serverUrl = isProduction
  ? process.env.PROD_API_URL || 'https://cafe-connect-backend-ih16.onrender.com'
  : `http://localhost:${process.env.PORT || 3000}`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cafe Connect API',
      version: '1.0.0',
      description: 'API documentation for Cafe Connect backend',
    },
    servers: [
      {
        // url: 'http://localhost:3000', // update with your port
        url: serverUrl, // update with your port
      },
    ],
  },
  apis: ['./index.js'], // 👈 path to your API routes (use .js/.ts files)
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = { swaggerUi, swaggerSpec };