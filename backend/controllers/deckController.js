// const { getDecks, createDeck } = require('../services/supabaseClient');

// // Obtener todos los mazos
// const getAllDecks = async (req, res) => {
//   try {
//     const decks = await getDecks();  // Suponiendo que getDecks() es una función en supabaseClient.js
//     res.json(decks);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error en el servidor');
//   }
// };

// // Crear un nuevo mazo
// const createDeck = async (req, res) => {
//   const { user_id, name, description } = req.body;
//   try {
//     const newDeck = await createDeck(user_id, name, description);  // Suponiendo que createDeck() es una función en supabaseClient.js
//     res.status(201).json(newDeck);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error en el servidor');
//   }
// };

// module.exports = {
//   getAllDecks,
//   createDeck,
// };
