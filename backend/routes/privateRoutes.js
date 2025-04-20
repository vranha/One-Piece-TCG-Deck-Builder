const express = require("express");
const validate = require("../middlewares/validate");
const { addCardToDeckSchema, editDeckSchema, createDeckSchema } = require("../validators/deckValidator");
const { loginUserSchema, registerUserSchema } = require("../validators/userValidator");
const userController = require("../controllers/userController");
const deckController = require("../controllers/deckController");
const cardController = require("../controllers/cardController");
const friendController = require("../controllers/friendController");
const authenticate = require("../middlewares/authMiddleware");
const { importarCartas } = require("../scripts/importCards");
const { supabase } = require("../services/supabaseClient");
const nodemailer = require("nodemailer");

const router = express.Router();

router.use(authenticate);

// EJEMPLLO DE USO DE ROLE con authorize:
// Editar mazo (solo administradores)
// router.put('/decks/:deckId',validate(editDeckSchema),authorize(['admin']),deckController.editDeck);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios con paginación y búsqueda
 *     tags: [Users]
 *     parameters:
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
 *         description: Texto de búsqueda para filtrar los usuarios por nombre de usuario
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de usuarios con la información de paginación
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
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                       role:
 *                         type: string
 *                       avatar_url:
 *                         type: string
 *                       bio:
 *                         type: string
 *                       location:
 *                         type: string
 *                       region:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
router.get("/users", userController.getAllUsers);

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
router.post("/decks", validate(createDeckSchema), deckController.createDeck);

// Obtener un mazo por ID con todas sus cartas
router.get("/deckById/:deckId", deckController.getDeckById);

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
router.put("/deck/:deckId", validate(editDeckSchema), deckController.editDeck);

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
router.get("/decks/:userId", deckController.getUserDecks);

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
router.post("/decks/cards", validate(addCardToDeckSchema), deckController.addCardToDeck);

/**
 * @swagger
 * /decks/cards/multiple:
 *   post:
 *     summary: Añadir múltiples cartas a un mazo
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
 *                 description: ID del mazo al que se añadirán las cartas
 *               cards:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     cardId:
 *                       type: string
 *                       description: ID de la carta
 *                     quantity:
 *                       type: integer
 *                       description: Cantidad de cartas
 *             required:
 *               - deckId
 *               - cards
 *     responses:
 *       201:
 *         description: Cartas añadidas con éxito al mazo
 *       400:
 *         description: Solicitud inválida
 *       500:
 *         description: Error interno del servidor
 */
router.post("/decks/cards/multiple", deckController.addMultipleCardsToDeck);

router.post("/decks/cards/sync", deckController.syncDeckCards);

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
router.delete("/decks/:deckId", deckController.deleteDeck);

/**
 * @swagger
 * /cards:
 *   get:
 *     summary: Buscar cartas con paginación y filtros
 *     tags: [Cards]
 *     parameters:
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
 *         description: Texto de búsqueda para filtrar las cartas por nombre o código
 *         schema:
 *           type: string
 *       - in: query
 *         name: rarity
 *         required: false
 *         description: Filtrar por rareza
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         required: false
 *         description: Filtrar por tipo
 *         schema:
 *           type: string
 *       - in: query
 *         name: cost
 *         required: false
 *         description: Filtrar por costo
 *         schema:
 *           type: integer
 *       - in: query
 *         name: power
 *         required: false
 *         description: Filtrar por poder
 *         schema:
 *           type: integer
 *       - in: query
 *         name: counter
 *         required: false
 *         description: Filtrar por contador
 *         schema:
 *           type: string
 *       - in: query
 *         name: color
 *         required: false
 *         description: Filtrar por color
 *         schema:
 *           type: string
 *       - in: query
 *         name: family
 *         required: false
 *         description: Filtrar por familia
 *         schema:
 *           type: string
 *       - in: query
 *         name: trigger
 *         required: false
 *         description: Filtrar por trigger (booleano)
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de cartas con la información de paginación
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
 *                         type: string
 *                       code:
 *                         type: string
 *                       rarity:
 *                         type: string
 *                       type:
 *                         type: string
 *                       name:
 *                         type: string
 *                       images_small:
 *                         type: string
 *                       images_large:
 *                         type: string
 *                       cost:
 *                         type: integer
 *                       attribute_name:
 *                         type: string
 *                       attribute_image:
 *                         type: string
 *                       power:
 *                         type: integer
 *                       counter:
 *                         type: string
 *                       color:
 *                         type: string
 *                       family:
 *                         type: string
 *                       ability:
 *                         type: string
 *                       trigger:
 *                         type: string
 *                       set_name:
 *                         type: string
 *                       notes:
 *                         type: object
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
 */
router.get("/cards", cardController.searchCards);

// Obtener una carta por ID
router.get("/cards/:id", cardController.getCardById);

// Nueva ruta para obtener todos los valores únicos de set_name
router.get("/set_names", cardController.getAllSetNames);

// Nueva ruta para obtener todos los valores únicos de family
router.get("/families", cardController.getAllFamilies);

// Nueva ruta para obtener todos los valores únicos de attribute
router.get("/attributes", cardController.getAllAttributes);

/**
 * @swagger
 * /cards/by-code/{code}:
 *   get:
 *     summary: Obtener todas las cartas con el mismo código
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         description: Código de la carta
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de cartas con el mismo código
 *       404:
 *         description: No se encontraron cartas
 */
router.get("/cards/by-code/:code", cardController.getCardsByCode);

/**
 * @swagger
 * /cards/by-codes:
 *   get:
 *     summary: Obtener todas las cartas cuyos card_id correspondan a los códigos enviados
 *     tags: [Cards]
 *     parameters:
 *       - in: query
 *         name: codes
 *         required: true
 *         description: Lista de códigos separados por comas
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de cartas correspondientes a los códigos
 *       400:
 *         description: Solicitud inválida
 *       500:
 *         description: Error interno del servidor
 */
router.get("/cards/by-codes/:codes", cardController.getCardsByCodes);

// Crear un endpoint para importar cartas
router.post("/import-cards", async (req, res) => {
    try {
        await importarCartas();
        res.status(200).json({ message: "Importación completada con éxito." });
    } catch (error) {
        console.error("Error al importar cartas:", error);
        res.status(500).json({ error: "Error al importar cartas." });
    }
});

router.post("/card", async (req, res) => {
    const cardData = req.body; // Los datos de la carta se envían en el cuerpo de la solicitud
    try {
        const { data, error } = await supabase.from("cards").insert([cardData]);
        if (error) {
            throw error;
        }
        res.status(201).json({ message: "Carta añadida con éxito.", card: data });
    } catch (error) {
        console.error("Error al añadir la carta:", error);
        res.status(500).json({ error: "Error al añadir la carta." });
    }
});

/**
 * @swagger
 * /decks/{deckId}/tags:
 *   get:
 *     summary: Obtener las etiquetas de un mazo
 *     tags: [Decks]
 *     parameters:
 *       - in: path
 *         name: deckId
 *         required: true
 *         description: ID del mazo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de etiquetas del mazo
 *       404:
 *         description: Mazo no encontrado
 */
router.get("/decks/:deckId/tags", deckController.getDeckTags);

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Obtener todas las etiquetas disponibles
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: Lista de etiquetas
 */
router.get("/tags", deckController.getAllTags);

/**
 * @swagger
 * /decks/{deckId}/tags:
 *   post:
 *     summary: Añadir una etiqueta a un mazo
 *     tags: [Decks]
 *     parameters:
 *       - in: path
 *         name: deckId
 *         required: true
 *         description: ID del mazo
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tagId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Etiqueta añadida con éxito
 */
router.post("/decks/:deckId/tags", deckController.addTagToDeck);

/**
 * @swagger
 * /decks/{deckId}/tags/{tagId}:
 *   delete:
 *     summary: Eliminar una etiqueta de un mazo
 *     tags: [Decks]
 *     parameters:
 *       - in: path
 *         name: deckId
 *         required: true
 *         description: ID del mazo
 *         schema:
 *           type: string
 *       - in: path
 *         name: tagId
 *         required: true
 *         description: ID de la etiqueta
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Etiqueta eliminada con éxito
 */
router.delete("/decks/:deckId/tags/:tagId", deckController.removeTagFromDeck);

router.post("/friends/request", friendController.sendFriendRequest);
router.get("/friends", friendController.getFriends);
router.get("/friends/:userId/accepted", friendController.getAcceptedFriends);
router.put("/friends/:friendId/accept", friendController.acceptFriendRequest);
router.delete("/friends/:friendId", friendController.removeFriend);
router.get("/friends/:friendId/decks", friendController.getFriendDecks);

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Obtener información del usuario actual
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID del usuario
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Información del usuario actual
 *       401:
 *         description: No autenticado
 */
router.get("/me", userController.getCurrentUserController); // Apply middleware

/**
 * @swagger
 * /send-deck-email:
 *   post:
 *     summary: Enviar un mazo por correo electrónico
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               deckName:
 *                 type: string
 *               deckString:
 *                 type: string
 *     responses:
 *       200:
 *         description: Correo enviado con éxito
 *       400:
 *         description: Datos incorrectos
 *       500:
 *         description: Error al enviar el correo
 */
router.post("/send-deck-email", async (req, res) => {
    const { email, deckName, userName, deckString } = req.body;

    if (!email || !deckName || !deckString) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail", // Use your email provider
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER, // Your email
                pass: process.env.EMAIL_PASS, // Your email password or app password
            },
        });

        const mailOptions = {
            from: `"OP LAB" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Your Deck: ${deckName}`,
            html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 640px; margin: auto; color: #2c2c2c; border: 1px solid #eaeaea;">
              
              <!-- Header -->
              <div style="display: flex; align-items: flex-start; margin-bottom: 24px;">
                <span style="font-size: 30px; color: #a84848; font-weight: bold;">O</span>
                <span style="font-size: 30px; color: #a84848; font-weight: bold; margin-right: 6px;">P</span>
                <span style="font-size: 30px; color: #000; font-weight: bold;">lab</span>
              </div>
          
              <!-- Greeting -->
              <p style="font-size: 17px; margin: 0 0 8px;">Hi <strong>${userName}</strong> 😆</p>
              <p style="font-size: 16px; margin: 0 0 24px;">Here is the deck you requested:</p>
          
              <!-- Deck name -->
              <div style="background: #f9f9f9; padding: 12px 20px; border-left: 4px solid #a84848; margin-bottom: 20px; border-radius: 6px;">
                <h3 style="font-size: 18px; margin: 0; color: #a84848;">${deckName}</h3>
              </div>
          
              <!-- Deck list -->
              <pre style="background: #f4f4f4; padding: 20px; border-radius: 10px; font-family: Consolas, monospace; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; color: #333;">
          ${deckString}
              </pre>
          
              <!-- Footer -->
              <div style="margin-top: 36px; text-align: center;">
                <p style="font-size: 14px; color: #888; margin: 0;">Thank you for using <strong>OP Lab</strong>! ❤️</p>
                <p style="font-size: 12px; color: #bbb; margin-top: 6px;">Need help? Contact us anytime.</p>
              </div>
          
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
});

router.post("/send-feedback", async (req, res) => {
    const { feedback, userName, userEmail } = req.body;

    if (!feedback || !userName || !userEmail) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"OP LAB Feedback" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Email address to receive feedback
            subject: `Feedback from ${userName ? userName : userEmail}`,
            html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 640px; margin: auto; color: #2c2c2c; border: 1px solid #eaeaea;">
              
              <!-- Header -->
              <div style="display: flex; align-items: flex-start; margin-bottom: 24px;">
                <span style="font-size: 30px; color: #a84848; font-weight: bold;">O</span>
                <span style="font-size: 30px; color: #a84848; font-weight: bold; margin-right: 6px;">P</span>
                <span style="font-size: 30px; color: #000; font-weight: bold;">lab</span>
              </div>
          
              <!-- Greeting -->
              <p style="font-size: 17px; margin: 0 0 8px;">Feedback from <strong>${userName}</strong> (${userEmail})</p>
              <p style="font-size: 16px; margin: 0 0 24px;">Here is the feedback:</p>
          
              <!-- Feedback content -->
              <div style="background: #f9f9f9; padding: 12px 20px; border-left: 4px solid #a84848; margin-bottom: 20px; border-radius: 6px;">
                <p style="font-size: 16px; margin: 0; color: #333;">${feedback}</p>
              </div>
          
              <!-- Footer -->
              <div style="margin-top: 36px; text-align: center;">
                <p style="font-size: 14px; color: #888; margin: 0;">Thank you boss <strong>OP Lab</strong>! ❤️</p>
              </div>
          
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Feedback sent successfully" });
    } catch (error) {
        console.error("Error sending feedback email:", error);
        res.status(500).json({ error: "Failed to send feedback" });
    }
});

router.put("/users/update-details", userController.updateUserDetails);

/**
 * @swagger
 * /decks:
 *   get:
 *     summary: Obtener todos los mazos con sus datos relacionados
 *     tags: [Decks]
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Lista de mazos con datos relacionados
 */
router.get("/decks", deckController.getAllDecks);

/**
 * @swagger
 * /friends:
 *   get:
 *     summary: Obtener todos los amigos del usuario actual
 *     tags: [Friends]
 *     responses:
 *       200:
 *         description: Lista de amigos
 */
router.get("/friends", async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user ID is available in the request
        const friends = await friendService.getAllFriends(userId);
        res.status(200).json(friends);
    } catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({ error: "Failed to fetch friends" });
    }
});

module.exports = router;
