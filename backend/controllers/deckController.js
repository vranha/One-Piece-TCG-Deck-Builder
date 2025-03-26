const deckService = require('../services/deckService');

// Crear un nuevo mazo con colores
const createDeck = async (req, res) => {
    const { userId, name, description, colors, leaderCardId } = req.body;
    try {
        const deck = await deckService.createDeck(userId, name, description, colors, leaderCardId);
        res.status(201).json(deck);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Editar un mazo (nombre, descripción, y colores)
const editDeck = async (req, res) => {
    const { deckId } = req.params;
    const { name, description, colors } = req.body;
    try {
        const updatedDeck = await deckService.editDeck(deckId, name, description, colors);
        res.status(200).json(updatedDeck);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Obtener los mazos de un usuario con paginación y búsqueda
const getUserDecks = async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10, search = '', color } = req.query;  // Recibir parámetros de consulta

    try {
        // Llamar al servicio con los parámetros de paginación, búsqueda y color
        const { data, count } = await deckService.getUserDecks(userId, page, limit, search, color);

        // Responder con los datos y la información de paginación
        res.status(200).json({
            data,
            pagination: {
                total: count,  // Total de registros
                page,
                limit,
                totalPages: Math.ceil(count / limit),  // Número total de páginas
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Obtener un mazo por ID con todas sus cartas
const getDeckById = async (req, res) => {
    const { deckId } = req.params;
    try {
        const deck = await deckService.getDeckById(deckId);
        res.status(200).json(deck);
    } catch (err) {
        console.error('Error en getDeckById:', err);
        res.status(500).json({ error: err.message });
    }
};

// Añadir cartas a un mazo
const addCardToDeck = async (req, res) => {
    const { deckId, cardId, quantity } = req.body;
    try {
        const data = await deckService.addCardToDeck(deckId, cardId, quantity);
        res.status(201).json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Eliminar un mazo y sus asociaciones
const deleteDeck = async (req, res) => {
    const { deckId } = req.params;
    try {
        const message = await deckService.deleteDeck(deckId);
        res.status(200).json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createDeck,
    editDeck,
    deleteDeck,
    getUserDecks,
    addCardToDeck,
    getDeckById, // Añadir la nueva función al módulo exportado
};