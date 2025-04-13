const deckService = require("../services/deckService");

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
    const { page = 1, limit = 10, search = "", color } = req.query; // Recibir parámetros de consulta

    try {
        // Llamar al servicio para obtener los mazos
        const { data: decks, count } = await deckService.getUserDecks(userId, page, limit, search, color);

        // Devolver los mazos junto con la cantidad total
        res.status(200).json({
            success: true,
            data: decks,
            total: count,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        });
    } catch (err) {
        console.error("Error en getUserDecks:", err.message);
        res.status(500).json({
            success: false,
            message: "Error al obtener los mazos.",
            error: err.message,
        });
    }
};

// Obtener un mazo por ID con todas sus cartas
const getDeckById = async (req, res) => {
    const { deckId } = req.params;
    try {
        const deck = await deckService.getDeckById(deckId);
        res.status(200).json(deck);
    } catch (err) {
        console.error("Error en getDeckById:", err);
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

// Añadir múltiples cartas a un mazo
const addMultipleCardsToDeck = async (req, res) => {
    const { deckId, cards } = req.body;
    try {
        const data = await deckService.addMultipleCardsToDeck(deckId, cards);
        res.status(201).json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
// Añadir múltiples cartas a un mazo
const syncDeckCards = async (req, res) => {
    const { deckId, cards } = req.body;
    try {
        const data = await deckService.syncDeckCards(deckId, cards);
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

const getDeckTags = async (req, res) => {
    const { deckId } = req.params;
    try {
        const tags = await deckService.getDeckTags(deckId);
        res.status(200).json(tags);
    } catch (err) {
        console.error("Error en getDeckTags:", err);
        res.status(500).json({ error: err.message });
    }
};

const getAllTags = async (req, res) => {
    try {
        const tags = await deckService.getAllTags();
        res.status(200).json(tags);
    } catch (err) {
        console.error("Error en getAllTags:", err);
        res.status(500).json({ error: err.message });
    }
};

const addTagToDeck = async (req, res) => {
    const { deckId } = req.params;
    const { tagId } = req.body;
    try {
        await deckService.addTagToDeck(deckId, tagId);
        res.status(201).json({ message: "Etiqueta añadida con éxito" });
    } catch (err) {
        console.error("Error en addTagToDeck:", err);
        res.status(500).json({ error: err.message });
    }
};

const removeTagFromDeck = async (req, res) => {
    const { deckId, tagId } = req.params;
    try {
        await deckService.removeTagFromDeck(deckId, tagId);
        res.status(200).json({ message: "Etiqueta eliminada con éxito" });
    } catch (err) {
        console.error("Error en removeTagFromDeck:", err);
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
    addMultipleCardsToDeck,
    syncDeckCards,
    getDeckTags,
    getAllTags,
    addTagToDeck,
    removeTagFromDeck,
};
