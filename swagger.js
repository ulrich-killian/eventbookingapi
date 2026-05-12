import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Booking API',
      version: '1.0.0',
      description: 'A high-concurrency backend for event planning and seat reservations',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
      { url: 'https://eventbookingapi-w0a3.onrender.com', description: 'Production' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js'],
};

export default swaggerJsdoc(options);