const express = require("express");
const validate = require("../middlewares/validate");
const { registerUserSchema, loginUserSchema } = require("../validators/userValidator");
const userController = require("../controllers/userController");
const authenticate = require("../middlewares/authenticate"); // Import authentication middleware

const router = express.Router();

/**
 * @swagger
 * /auth/callback:
 *   get:
 *     summary: Confirmar la dirección de correo electrónico
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Confirmación exitosa
 */
router.get("/auth/callback", userController.getCallback);

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado con éxito
 *       400:
 *         description: Datos incorrectos
 */
router.post("/register", validate(registerUserSchema), userController.registerUserController);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *       401:
 *         description: Credenciales incorrectas
 */
router.post("/login", validate(loginUserSchema), userController.loginUserController);

module.exports = router;
