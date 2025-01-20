const Joi = require('joi');

const addCardToDeckSchema = Joi.object({
    deckId: Joi.string().required().messages({
        'string.empty': 'El ID del mazo es obligatorio.',
    }),
    cardId: Joi.string().required().messages({
        'string.empty': 'El ID de la carta es obligatorio.',
    }),
    quantity: Joi.number().integer().min(1).required().messages({
        'number.base': 'La cantidad debe ser un número.',
        'number.min': 'La cantidad mínima es 1.',
    }),
});

// Validador para crear un mazo
const createDeckSchema = Joi.object({
    userId: Joi.string().required().messages({
        'string.empty': 'El ID del usuario es obligatorio.',
    }),
    name: Joi.string().required().messages({
        'string.empty': 'El nombre del mazo es obligatorio.',
    }),
    description: Joi.string().allow('').optional(), // Permite descripción vacía
    colors: Joi.array().items(Joi.number().integer()).required().messages({
        'array.base': 'Los colores deben ser un array de números.',
    }),
});

// Validador para editar un mazo
const editDeckSchema = Joi.object({
    name: Joi.string().optional().messages({
        'string.empty': 'El nombre no puede estar vacío.',
    }),
    description: Joi.string().allow('').optional(),
    colors: Joi.array().items(Joi.number().integer()).optional().messages({
        'array.base': 'Los colores deben ser un array de números.',
    }),
});


module.exports = {
    addCardToDeckSchema,
    createDeckSchema,
    editDeckSchema,
};
