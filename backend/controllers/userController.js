const {
    getUsers,
    createUser,
    registerUser,
    loginUser,
    getSession,
    handleEmailConfirmation,
    getCurrentUser,
    updateUserDetails,
    getUserById,
    updateUserVisibility,
} = require("../services/supabaseClient");
const friendService = require("../services/friendService");

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
    const { page = 1, limit = 10, search = "", excludeUserId, region, deckCount } = req.query;

    try {
        const users = await getUsers(page, limit, search, excludeUserId, region, deckCount);
        res.status(200).json(users);
    } catch (err) {
        console.error("Error en getAllUsers:", err.message);
        res.status(500).json({ error: err.message });
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
    const { username, bio, location, region, avatar_url, lang } = req.body; // Include lang
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
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (lang !== undefined) updates.lang = lang; // Add lang to updates

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

const getUserByIdController = async (req, res) => {
    const { id } = req.params; // Extract user ID from route parameters
    if (!id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const user = await getUserById(id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user by ID:", error.message);
        res.status(500).json({ error: "Failed to fetch user" });
    }
};

const searchUsersWithFriendsFirst = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { query = "" } = req.query;
        if (!userId) return res.status(400).json({ error: "userId is required" });

        // Buscar todos los usuarios
        const allUsers = await getUsers(1, 10000, query); // Trae todos los users que coincidan con el query
        const usersList = allUsers.data || [];

        // Buscar amigos
        const friends = await friendService.getFriends(userId);
        const friendIds = friends.map((f) => f.id);

        // Marcar cada usuario con isFriend
        const usersWithFriendFlag = usersList.map((u) => ({ ...u, isFriend: friendIds.includes(u.id) }));
        // Ordenar: amigos primero
        usersWithFriendFlag.sort((a, b) => (b.isFriend ? 1 : 0) - (a.isFriend ? 1 : 0));

        res.json(usersWithFriendFlag);
    } catch (err) {
        res.status(500).json({ error: "Error searching users" });
    }
};

const updateUserVisibilityController = async (req, res) => {
    // Permitir userId en el body (para compatibilidad con frontend)
    const userId = req.body.userId || req.user?.id;
    const { decks_visibility, friends_visibility, collections_visibility } = req.body;
    const allowed = ["public", "private", "friends"];
    if (
        (decks_visibility && !allowed.includes(decks_visibility)) ||
        (friends_visibility && !allowed.includes(friends_visibility)) ||
        (collections_visibility && !allowed.includes(collections_visibility))
    ) {
        return res.status(400).json({ error: "Invalid visibility value" });
    }
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }
    try {
        await updateUserVisibility(userId, { decks_visibility, friends_visibility, collections_visibility });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
    getUserByIdController,
    searchUsersWithFriendsFirst,
    updateUserVisibility: updateUserVisibilityController,
};
