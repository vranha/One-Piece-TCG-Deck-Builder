// Importar el cliente de Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Crear el cliente de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Funciones para interactuar con la base de datos

// Obtener todos los usuarios
const getUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

// Crear un nuevo usuario en la tabla 'users'
const createUser = async (id, username, email) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ id, username, email }]); // Usar el id generado por Supabase
  if (error) throw new Error(error.message);
  return data;
};

const registerUser = async (email, password) => {
  const response = await supabase.auth.signUp({ email, password });
  console.log('Respuesta de signUp:', response); // Verifica la estructura
  const { data, error } = response;

  if (error) {
    console.error('Error en la autenticación de Supabase:', error);
    throw new Error(error.message);
  }

  return data.user; // Asegúrate de que esto sea válido
};



// Autenticación: Iniciar sesión (con correo y contraseña)
const loginUser = async (email, password) => {
  const { user, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }
  return user;
};

// Obtener la sesión activa del usuario
const getSession = async () => {
  const { data: session, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return session;
};


const handleEmailConfirmation = async () => {
  const { data: session, error } = await supabase.auth.getSession(); // Verifica la sesión activa
  if (error) {
    throw new Error(error.message);
  }
  if (!session) {
    throw new Error('No hay una sesión activa. Verifica que el email ha sido confirmado correctamente.');
  }
  return session; // Devuelve la sesión del usuario
};
// Otras funciones necesarias (como mazos, cartas, etc.)

module.exports = {
  getUsers,
  createUser,
  registerUser,
  loginUser,
  getSession,
  handleEmailConfirmation,
};
