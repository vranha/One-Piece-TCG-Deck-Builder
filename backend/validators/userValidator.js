const Joi = require('joi');

const registerUserSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'El email debe ser válido.',
        'string.empty': 'El email es obligatorio.',
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'La contraseña debe tener al menos 6 caracteres.',
        'string.empty': 'La contraseña es obligatoria.',
    }),
});

const loginUserSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'El email debe ser válido.',
        'string.empty': 'El email es obligatorio.',
    }),
    password: Joi.string().required().messages({
        'string.empty': 'La contraseña es obligatoria.',
    }),
});

module.exports = {
    registerUserSchema,
    loginUserSchema,
};
