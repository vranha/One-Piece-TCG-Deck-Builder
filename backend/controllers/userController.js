const {
    getUsers,
    createUser,
    registerUser,
    loginUser,
    getSession,
    handleEmailConfirmation,
    getCurrentUser,
    updateUserDetails,
} = require("../services/supabaseClient");

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
    try {
        const users = await getUsers();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error en el servidor");
    }
};

const registerUserController = async (req, res) => {
    const { username, email, password } = req.body;

    // Validación de campos obligatorios
    if (!username || !email || !password) {
        return res.status(400).send("Todos los campos son obligatorios");
    }

    try {
        // Registrar al usuario en el sistema de autenticación
        const user = await registerUser(email, password);

        if (!user || !user.id) {
            return res.status(500).send("Error al registrar el usuario en el sistema de autenticación");
        }

        // Guardar datos adicionales del usuario en la tabla personalizada
        const newUser = await createUser(user.id, username, email);

        res.status(201).json({ user, newUser });
    } catch (error) {
        console.error("Error al registrar usuario:", error.message);
        res.status(500).send("Error en el servidor");
    }
};

// Iniciar sesión
const loginUserController = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { user, access_token } = await loginUser(email, password);
        res.status(200).json({
            user,
            access_token, // Incluir el token en la respuesta
        });
    } catch (error) {
        console.error(error);
        res.status(401).send("Credenciales incorrectas");
    }
};

// Obtener la sesión del usuario
const getSessionController = async (req, res) => {
    try {
        const session = await getSession();
        if (!session) {
            return res.status(401).send("No autenticado");
        }
        res.status(200).json(session);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error en el servidor");
    }
};

const getCallback = async (req, res) => {
    try {
        const session = await handleEmailConfirmation(); // Llama al servicio
        res.status(200).send("¡Email confirmado con éxito!"); // Responde con éxito
    } catch (error) {
        console.error("Error en la confirmación:", error.message);
        res.status(400).send("Hubo un error al confirmar tu email.");
    }
};

const getCurrentUserController = async (req, res) => {
    const userId = req.query.id; // Obtener el ID del usuario desde los parámetros de consulta
    if (!userId) {
        return res.status(400).send("El ID del usuario es obligatorio");
    }
    try {
        const user = await getCurrentUser(userId);
        if (!user) {
            return res.status(404).send("Usuario no encontrado");
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error al obtener el usuario actual:", error.message);
        res.status(500).send("Error en el servidor");
    }
};

const updateUserDetailsController = async (req, res) => {
    const { username, bio, location, region } = req.body;
    const userId = req.query.id; // Retrieve userId from query parameters

    if (!userId) {
        console.error("User ID is missing in the request.");
        return res.status(400).json({ error: "User ID is required" });
    }

    const updates = {};
    if (username !== undefined) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (region !== undefined) updates.region = region;

    if (Object.keys(updates).length === 0) {
        console.error("No fields to update in the request.");
        return res.status(400).json({ error: "No fields to update" });
    }

    console.log("Updating user details:", { userId, updates });

    try {
        await updateUserDetails(userId, updates);
        console.log("User details updated successfully.");
        res.status(200).json({ message: "User details updated successfully" });
    } catch (error) {
        console.error("Error updating user details:", error.message);
        res.status(500).json({ error: "Failed to update user details" });
    }
};

module.exports = {
    getAllUsers,
    registerUserController,
    loginUserController,
    getSessionController,
    getCallback,
    getCurrentUserController,
    updateUserDetails: updateUserDetailsController,
};
