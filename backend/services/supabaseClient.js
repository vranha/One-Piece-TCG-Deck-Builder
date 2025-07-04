// Importar el cliente de Supabase
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Funciones para interactuar con la base de datos

// Obtener todos los usuarios
const getUsers = async (page = 1, limit = 10, search = "", excludeUserId, region, deckCount) => {
    const offset = (page - 1) * limit;

    console.log("Executing getUsers with:", { deckCount });
    let query = supabase
        .from("users")
        .select("*", { count: "exact" }) // Fetch users without joining decks
        .ilike("username", `%${search}%`)
        .range(offset, offset + limit - 1);

    if (excludeUserId) {
        query = query.neq("id", excludeUserId);
    }

    if (region) {
        query = query.eq("region", region); // Filter by region
    }

    const { data: users, error, count } = await query;

    if (error) {
        throw new Error(error.message);
    }

    // Fetch deck counts and most frequent colors for each user
    const usersWithDetails = await Promise.all(
        users.map(async (user) => {
            // Get deck count
            const { count: userDeckCount, error: deckError } = await supabase
                .from("decks")
                .select("*", { count: "exact" })
                .eq("user_id", user.id);

            if (deckError) {
                console.error(`Error fetching decks for user ${user.id}:`, deckError.message);
            }
            console.log(`User ${user.username} has ${userDeckCount} decks`);

            // Skip users based on deckCount filter
            if (deckCount === "hasDecks" && (!userDeckCount || userDeckCount <= 0)) {
                return null; // Exclude users with no decks
            }
            if (deckCount === "noDecks" && userDeckCount > 0) {
                return null; // Exclude users with decks
            }

            // Get all deck IDs for the user
            const { data: userDecks, error: userDecksError } = await supabase
                .from("decks")
                .select("id")
                .eq("user_id", user.id);

            if (userDecksError) {
                console.error(`Error fetching user decks for user ${user.id}:`, userDecksError.message);
            }

            const deckIds = userDecks?.map((deck) => deck.id) || [];

            // Get all colors associated with the user's decks
            const { data: deckColors, error: deckColorsError } = await supabase
                .from("deck_colors")
                .select("color_id")
                .in("deck_id", deckIds);

            if (deckColorsError) {
                console.error(`Error fetching deck colors for user ${user.id}:`, deckColorsError.message);
            }

            // Count occurrences of each color
            const colorCounts = {};
            deckColors?.forEach(({ color_id }) => {
                colorCounts[color_id] = (colorCounts[color_id] || 0) + 1;
            });

            // Get the two most frequent colors
            const topColors = Object.entries(colorCounts)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, 2)
                .map(([colorId]) => parseInt(colorId, 10));

            // Fetch color names for the top colors
            const { data: colors, error: colorsError } = await supabase
                .from("colors")
                .select("name")
                .in("id", topColors);

            if (colorsError) {
                console.error(`Error fetching color names for user ${user.id}:`, colorsError.message);
            }

            const colorNames = colors?.map((color) => color.name) || [];

            return {
                ...user,
                deck_count: userDeckCount || 0,
                top_colors: colorNames,
            };
        })
    );

    return {
        data: usersWithDetails.filter(Boolean), // Remove null entries
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
    };
};

// Crear un nuevo usuario en la tabla 'users'
const createUser = async (id, username, email) => {
    const { data, error } = await supabase.from("users").insert([{ id, username, email }]); // Usar el id generado por Supabase
    if (error) throw new Error(error.message);
    return data;
};

const registerUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    // client
    if (error) {
        console.error("Error en la autenticación de Supabase:", error.message);
        throw new Error(error.message);
    }

    if (!data || !data.user) {
        throw new Error("No se pudo registrar el usuario en Supabase Authentication");
    }

    return data.user; // Devuelve el usuario registrado
};

// Autenticación: Iniciar sesión (con correo y contraseña)
const loginUser = async (email, password) => {
    // Primero, verificamos si hay una sesión activa
    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession();
    if (session) {
        console.log("Sesión activa encontrada:", session);
        return { user: session.user, access_token: session.access_token };
    }

    // Si no hay sesión activa, procedemos con el inicio de sesión
    const { user, session: newSession, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        throw new Error(error.message);
    }
    if (!newSession) {
        throw new Error("No se pudo obtener un token de sesión.");
    }

    return {
        user,
        access_token: newSession.access_token,
    };
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
        throw new Error("No hay una sesión activa. Verifica que el email ha sido confirmado correctamente.");
    }
    return session; // Devuelve la sesión del usuario
};

const getCurrentUser = async (userId) => {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
    if (error) throw error;
    return data;
};

const updateUserDetails = async (userId, updates) => {
    console.log("Executing updateUserDetails with:", { userId, updates });
    const { error } = await supabase.from("users").update(updates).eq("id", userId);

    if (error) {
        console.error("Supabase update error:", error.message);
        throw new Error(error.message);
    }
    console.log("Supabase update successful.");
};

const getUserById = async (userId) => {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
    if (error) {
        console.error("Error fetching user by ID:", error.message);
        throw new Error(error.message);
    }
    return data;
};

const searchUsersWithFriendsFirst = async (userId, query) => {
    // Buscar usuarios que coincidan con el query
    let { data: users, error: usersError } = await supabase
        .from("users")
        .select("id,username,avatar_url")
        .ilike("username", `%${query}%`);
    if (usersError) throw usersError;
    return users;
};

// Actualizar visibilidad del usuario
const updateUserVisibility = async (userId, { decks_visibility, friends_visibility, collections_visibility }) => {
    if (!userId) throw new Error("userId is required for updateUserVisibility");
    const { error } = await supabase
        .from("users")
        .update({ decks_visibility, friends_visibility, collections_visibility })
        .eq("id", userId);
    if (error) throw new Error(error.message);
};

// Otras funciones necesarias (como mazos, cartas, etc.)

module.exports = {
    getUsers,
    createUser,
    registerUser,
    loginUser,
    getSession,
    handleEmailConfirmation,
    getCurrentUser,
    updateUserDetails,
    getUserById,
    searchUsersWithFriendsFirst,
    updateUserVisibility,
    supabase,
};
