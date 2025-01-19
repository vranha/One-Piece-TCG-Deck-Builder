const express = require('express');
const userController = require('../controllers/userController');
// const deckController = require('../controllers/deckController');

const router = express.Router();

// Rutas de usuarios
router.get('/users', userController.getAllUsers);
router.get('/auth/callback', userController.getCallback);
router.post('/register', userController.registerUserController);
router.post('/login', userController.loginUserController);

// Rutas de mazos
// router.get('/decks', deckController.getAllDecks);
// router.post('/decks', deckController.createDeck);

module.exports = router;
