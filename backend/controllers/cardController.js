const cardService = require('../services/cardService');

// Buscar cartas con paginación y filtros
const searchCards = async (req, res) => {
    const { page = 1, limit = 10, search = '', rarity, type, cost, power, counter, color, family, trigger } = req.query;  // Recibir parámetros de consulta

    try {
        // Llamar al servicio con los parámetros de paginación y búsqueda
        const { data, count } = await cardService.searchCards(page, limit, search, { rarity, type, cost, power, counter, color, family, trigger });

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

// Obtener una carta por ID
const getCardById = async (req, res) => {
    const { id } = req.params;

    try {
        const card = await cardService.getCardById(id);
        res.status(200).json(card);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    searchCards,
    getCardById,
};