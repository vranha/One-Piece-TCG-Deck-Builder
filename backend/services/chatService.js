const { supabase } = require("./supabaseClient");

const getUserChats = async (userId) => {
    console.log("Buscando chats para userId:", userId);
    // Trae los chats donde el usuario es user1 o user2
    const { data: chats, error } = await supabase
        .from("chats")
        .select("*", { count: "exact" })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("updated_at", { ascending: false });
    if (error) {
        console.error("Error en consulta de chats:", error);
        throw error;
    }
    if (!chats || chats.length === 0) return [];

    // Obtener los ids de los otros usuarios
    const otherUserIds = chats.map((chat) => (chat.user1_id === userId ? chat.user2_id : chat.user1_id));
    // Quitar duplicados
    const uniqueUserIds = Array.from(new Set(otherUserIds));

    // Traer los datos de los otros usuarios
    const { data: users, error: userError } = await supabase
        .from("users")
        .select("id,username,avatar_url")
        .in("id", uniqueUserIds);
    if (userError) {
        console.error("Error trayendo usuarios:", userError);
        throw userError;
    }

    // Mapear los datos de usuario a cada chat
    const chatsWithUser = chats.map((chat) => {
        const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
        const otherUser = users.find((u) => u.id === otherUserId);
        return {
            ...chat,
            other_user: otherUser || {
                id: otherUserId,
                username: "Usuario",
                avatar_url: undefined,
            },
        };
    });
    console.log("Resultado de chats:", chatsWithUser);
    return chatsWithUser;
};

const createOrGetChat = async (userId, otherUserId) => {
    // Busca si ya existe un chat entre ambos, si no lo crea
    let { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(
            `and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`
        )
        .single();
    if (data) return data;
    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found

    // Crear chat
    const { data: newChat, error: createError } = await supabase
        .from("chats")
        .insert([{ user1_id: userId, user2_id: otherUserId }])
        .select("*")
        .single();
    if (createError) throw createError;
    return newChat;
};

const getChatMessages = async (chatId) => {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
};

const sendMessage = async (chatId, senderId, content) => {
    // Insertar mensaje y actualizar last_message en chat
    const { data: message, error } = await supabase
        .from("messages")
        .insert([{ chat_id: chatId, sender_id: senderId, content }])
        .select("*")
        .single();
    if (error) throw error;

    await supabase
        .from("chats")
        .update({ last_message: content, updated_at: new Date().toISOString() })
        .eq("id", chatId);

    return message;
};

module.exports = {
    getUserChats,
    createOrGetChat,
    getChatMessages,
    sendMessage,
};
