const dotenv = require('dotenv');
const express = require('express');
const routes = require('./routes/routes');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

// Usar las rutas del archivo `routes.js`
app.use('/api', routes); // Todas las rutas estarán bajo el prefijo /api

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
