const dotenv = require("dotenv");
const cors = require("cors");
const express = require("express");
const publicRoutes = require("./routes/publicRoutes");
const privateRoutes = require("./routes/privateRoutes");
const { swaggerUi, swaggerSpec } = require("./config/swagger"); // Importar Swagger
const deckImageRoute = require("./routes/deckImage");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Ruta para servir la documentación de la API generada por Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Esta línea sirve la UI de Swagger

app.get("/swagger.json", (req, res) => {
    res.json(swaggerSpec); // Devuelve la especificación Swagger como JSON
});

// Usar las rutas
app.use("/private", privateRoutes);
app.use("/private/image", deckImageRoute);
app.use("/public", publicRoutes);

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
