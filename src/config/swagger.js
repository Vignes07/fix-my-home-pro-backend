import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FixMyHome Pro API',
            version: '1.0.0',
            description: 'API Documentation for FixMyHome Pro marketplace application',
        },
        servers: [
            {
                url: process.env.VITE_API_URL || 'http://localhost:5000/api',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js'], // Path to the API docs
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
