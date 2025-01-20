const express = require('express');
const validate = require('../middlewares/validate');
const { addCardToDeckSchema, editDeckSchema, createDeckSchema } = require('../validators/deckValidator');
const { loginUserSchema, registerUserSchema } = require('../validators/userValidator');
const userController = require('../controllers/userController');
const deckController = require('../controllers/deckController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);


// EJEMPLLO DE USO DE ROLE con authorize:
// Editar mazo (solo administradores)
// router.put('/decks/:deckId',validate(editDeckSchema),authorize(['admin']),deckController.editDeck);


/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/users', userController.getAllUsers);


/**
 * @swagger
 * /decks:
 *   post:
 *     summary: Crear un nuevo mazo
 *     tags: [Decks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               colors:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Mazo creado con éxito
 *       400:
 *         description: Datos incorrectos
 */
router.post('/decks', validate(createDeckSchema), deckController.createDeck);

/**
 * @swagger
 * /decks/{deckId}:
 *   put:
 *     summary: Editar un mazo
 *     tags: [Decks]
 *     parameters:
 *       - in: path
 *         name: deckId
 *         required: true
 *         description: ID del mazo a editar
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               colors:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Mazo actualizado con éxito
 *       404:
 *         description: Mazo no encontrado
 */
router.put('/decks/:deckId', validate(editDeckSchema), deckController.editDeck);

/**
 * @swagger
 * /decks/{userId}:
 *   get:
 *     summary: Obtener los mazos de un usuario con paginación y búsqueda
 *     tags: [Decks]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID del usuario cuyos mazos se quieren obtener
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         required: false
 *         description: Número de página (por defecto es 1)
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Número de elementos por página (por defecto es 10)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: search
 *         required: false
 *         description: Texto de búsqueda para filtrar los mazos por nombre
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de mazos del usuario con la información de paginación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user_id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Parámetros incorrectos (por ejemplo, página o límite fuera de rango)
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/decks/:userId', deckController.getUserDecks);


/**
 * @swagger
 * /decks/cards:
 *   post:
 *     summary: Añadir una carta a un mazo
 *     tags: [Decks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deckId:
 *                 type: string
 *                 description: ID del mazo al que se añadirá la carta
 *               cardId:
 *                 type: string
 *                 description: ID de la carta que se añadirá al mazo
 *               quantity:
 *                 type: integer
 *                 description: Cantidad de cartas que se añadirán al mazo
 *             required:
 *               - deckId
 *               - cardId
 *               - quantity
 *     responses:
 *       201:
 *         description: Carta añadida con éxito al mazo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Carta añadida con éxito
 *                 deck:
 *                   type: object
 *                   description: Información actualizada del mazo
 *       400:
 *         description: Solicitud inválida (datos incorrectos o incompletos)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/decks/cards', validate(addCardToDeckSchema), deckController.addCardToDeck);


/**
 * @swagger
 * /decks/{deckId}:
 *   delete:
 *     summary: Eliminar un mazo
 *     tags: [Decks]
 *     parameters:
 *       - in: path
 *         name: deckId
 *         required: true
 *         description: ID del mazo a eliminar
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mazo eliminado con éxito
 *       404:
 *         description: Mazo no encontrado
 */
router.delete('/decks/:deckId', deckController.deleteDeck);

module.exports = router;
