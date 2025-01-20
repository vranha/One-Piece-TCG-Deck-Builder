const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0', // Versión de OpenAPI
        info: {
            title: 'My API para OP TCG APP', // Título de la API
            version: '1.0.0', // Versión de la API
            description: 'Documentación de la API para gestionar usuarios, mazos etc', // Descripción de la API
        },
    },
    // Asegúrate de incluir la ruta a tus archivos de rutas
    apis: ['./routes/routes.js'], // Busca comentarios en tus archivos de rutas
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
    swaggerUi,
    swaggerSpec
};
