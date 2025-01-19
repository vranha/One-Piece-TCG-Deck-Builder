const { getUsers, createUser, registerUser, loginUser, getSession, handleEmailConfirmation } = require('../services/supabaseClient');

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en el servidor');
  }
};

const registerUserController = async (req, res) => {
  const { username, email, password } = req.body;

  // Validación de campos obligatorios
  if (!username || !email || !password) {
    return res.status(400).send('Todos los campos son obligatorios');
  }

  try {
    // Registrar al usuario en el sistema de autenticación
    const user = await registerUser(email, password);

    // Guardar datos adicionales del usuario en la tabla personalizada
    const newUser = await createUser(user.id, username, email);

    res.status(201).json({ user, newUser });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en el servidor');
  }
};


// Iniciar sesión
const loginUserController = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await loginUser(email, password);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(401).send('Credenciales incorrectas');
  }
};

// Obtener la sesión del usuario
const getSessionController = async (req, res) => {
  try {
    const session = await getSession();
    if (!session) {
      return res.status(401).send('No autenticado');
    }
    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en el servidor');
  }
};

const getCallback = async (req, res) => {
  try {
    const session = await handleEmailConfirmation(); // Llama al servicio
    res.status(200).send('¡Email confirmado con éxito!'); // Responde con éxito
  } catch (error) {
    console.error('Error en la confirmación:', error.message);
    res.status(400).send('Hubo un error al confirmar tu email.');
  }
};

module.exports = {
  getAllUsers,
  registerUserController,
  loginUserController,
  getSessionController,
  getCallback,
};
