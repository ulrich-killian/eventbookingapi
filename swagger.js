import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';                         
import { fileURLToPath } from 'url'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  apis: [path.join(__dirname, './src/routes/*.js')],
};

export default swaggerJsdoc(options);