// controllers/cardController.js
const cardService = require("../services/cardService");

// Helper para limpiar parámetros: si vienen como "undefined" se convierten a undefined real
const sanitizeParam = (param) => (param === "undefined" ? undefined : param);

// Buscar cartas con paginación y filtros
const searchCards = async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search = "",
        rarity,
        type,
        cost,
        cost_gte,
        cost_lte,
        power,
        power_gte,
        power_lte,
        counter,
        counter_gte,
        counter_lte,
        color,
        family,
        trigger,
        life,
        life_gte,
        life_lte,
        set_name,
        ability,
        uniqueCodes, // Add uniqueCodes to destructured query parameters
    } = req.query;

    try {
        const filters = {
            rarity: rarity ? rarity.split(",").map(sanitizeParam) : undefined,
            type: type ? type.split(",").map(sanitizeParam) : undefined,
            cost: sanitizeParam(cost),
            cost_gte: sanitizeParam(cost_gte),
            cost_lte: sanitizeParam(cost_lte),
            power: sanitizeParam(power),
            power_gte: sanitizeParam(power_gte),
            power_lte: sanitizeParam(power_lte),
            counter: sanitizeParam(counter),
            counter_gte: sanitizeParam(counter_gte),
            counter_lte: sanitizeParam(counter_lte),
            color: color ? color.split(",").map(sanitizeParam) : undefined,
            family: sanitizeParam(family),
            trigger: trigger === "true" ? true : undefined,
            life: sanitizeParam(life),
            life_gte: sanitizeParam(life_gte),
            life_lte: sanitizeParam(life_lte),
            set_name: sanitizeParam(set_name),
            ability: ability ? ability.split(",").map(sanitizeParam) : undefined,
            attribute_name: req.query.attribute_name ? req.query.attribute_name.split(",") : undefined,
            uniqueCodes: uniqueCodes === "true", // Convert uniqueCodes to a boolean
        };

        const { data, count } = await cardService.searchCards(page, limit, search, filters);

        res.status(200).json({
            data,
            pagination: {
                total: count,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(count / limit),
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

// Obtener todos los valores únicos de set_name
const getAllSetNames = async (req, res) => {
    try {
        const setNames = await cardService.getAllSetNames();
        res.status(200).json(setNames);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Obtener todos los valores únicos de attribute_name y attribute_color
const getAllAttributes = async (req, res) => {
    try {
        const attributes = await cardService.getAllAttributes();
        res.status(200).json(attributes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Obtener todos los valores únicos de family
const getAllFamilies = async (req, res) => {
    try {
        const setNames = await cardService.getAllFamilies();
        res.status(200).json(setNames);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

const getCardsByCode = async (req, res) => {
    const { code } = req.params;
    console.log("Received code:", code); // Log para verificar el valor de code
    try {
        const cards = await cardService.getCardsByCode(code);
        if (!cards.length) {
            return res.status(404).json({ message: "No se encontraron cartas con este código." });
        }
        res.status(200).json(cards);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

const getCardsByCodes = async (req, res) => {
    const { codes } = req.params; // Obtener los códigos desde los parámetros de la URL
    console.log("getCardsByCodes called with codes:", codes);

    if (!codes) {
        return res.status(400).json({ error: "Codes parameter is required" });
    }

    try {
        const codeArray = codes.split(","); // Dividir los códigos en un array
        const cards = await cardService.getCardsByCodes(codeArray);
        res.status(200).json(cards);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    searchCards,
    getCardById,
    getAllSetNames,
    getAllFamilies,
    getCardsByCode,
    getAllAttributes,
    getCardsByCodes,
};
