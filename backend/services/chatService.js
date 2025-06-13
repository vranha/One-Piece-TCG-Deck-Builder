const { supabase } = require("./supabaseClient");
const deckService = require("./deckService");
const cardService = require("./cardService");
const collectionService = require("./collectionService");

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
    const chatsWithUser = await Promise.all(
        chats.map(async (chat) => {
            const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
            const otherUser = users.find((u) => u.id === otherUserId);
            // Buscar el último mensaje para obtener su type
            let lastMessageType = null;
            if (chat.last_message) {
                const { data: lastMsg, error: lastMsgError } = await supabase
                    .from("messages")
                    .select("type")
                    .eq("chat_id", chat.id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();
                if (!lastMsgError && lastMsg) lastMessageType = lastMsg.type;
            }
            return {
                ...chat,
                other_user: otherUser || {
                    id: otherUserId,
                    username: "Usuario",
                    avatar_url: undefined,
                },
                last_message_type: lastMessageType,
            };
        })
    );
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
    const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
    if (error) throw error;
    if (!messages || messages.length === 0) return [];

    // Buscar los mensajes especiales (type === 'deck' o 'card' o 'collection')
    const deckMsgIds = messages.filter((m) => m.type === "deck" && m.ref_id).map((m) => m.ref_id);
    const cardMsgIds = messages.filter((m) => m.type === "card" && m.ref_id).map((m) => m.ref_id);
    const collectionMsgIds = messages.filter((m) => m.type === "collection" && m.ref_id).map((m) => m.ref_id);

    // Consultar decks, cards y collections en paralelo si hay
    let decksById = {},
        cardsById = {},
        collectionsById = {};
    if (deckMsgIds.length > 0) {
        const decks = await Promise.all(
            deckMsgIds.map(async (id) => {
                try {
                    const deck = await deckService.getDeckById(id);
                    return deck;
                } catch (e) {
                    console.warn(`Deck no encontrado para id: ${id}`);
                    return { id, notFound: true };
                }
            })
        );
        decks.forEach((deck) => {
            if (deck && deck.id) decksById[deck.id] = deck;
        });
    }
    if (cardMsgIds.length > 0) {
        const cards = await cardService.getCardsByCodes(cardMsgIds);
        cards.forEach((card) => {
            if (card && card.id) cardsById[card.id] = card;
        });
    }
    if (collectionMsgIds.length > 0) {
        const collections = await Promise.all(
            collectionMsgIds.map(async (id) => {
                try {
                    const collection = await collectionService.getCollectionById(id);
                    return collection;
                } catch (e) {
                    console.warn(`Collection no encontrada para id: ${id}`);
                    return { id, notFound: true };
                }
            })
        );
        collections.forEach((collection) => {
            if (collection && collection.id) collectionsById[collection.id] = collection;
        });
    }

    // Enriquecer los mensajes
    const enriched = messages.map((m) => {
        if (m.type === "deck" && m.ref_id) {
            const deck = decksById[m.ref_id];
            if (deck && !deck.notFound) return { ...m, deck };
            if (deck && deck.notFound) return { ...m, deck: null };
        }
        if (m.type === "card" && m.ref_id && cardsById[m.ref_id]) {
            return { ...m, card: cardsById[m.ref_id] };
        }
        if (m.type === "collection" && m.ref_id) {
            let collection = collectionsById[m.ref_id];
            if (collection && !collection.notFound) {
                // Elimina collection_cards si existe
                if (collection.collection_cards) {
                    const { collection_cards, ...rest } = collection;
                    collection = rest;
                }
                return { ...m, collection };
            }
            if (collection && collection.notFound) return { ...m, collection: null };
        }
        return m;
    });
    return enriched;
};

const sendMessage = async (chatId, senderId, content, type = "text", ref_id = null) => {
    const insertObj = { chat_id: chatId, sender_id: senderId, content, type };
    if (ref_id) insertObj.ref_id = ref_id;
    const { data: message, error } = await supabase.from("messages").insert([insertObj]).select("*").single();
    if (error) throw error;

    const { data: chat, error: chatError } = await supabase
        .from("chats")
        .select("user1_id, user2_id")
        .eq("id", chatId)
        .single();
    if (chatError) throw chatError;

    let updateFields = { last_message: content, updated_at: new Date().toISOString() };
    if (chat.user1_id === senderId) updateFields.user2_read = false;
    else if (chat.user2_id === senderId) updateFields.user1_read = false;

    await supabase.from("chats").update(updateFields).eq("id", chatId);

    return message;
};

const sendBulkMessages = async (chatId, sender_id, messages) => {
    // messages: [{ content, type, ref_id }]
    const inserts = messages.map((msg) => ({
        chat_id: chatId,
        sender_id,
        content: msg.content,
        type: msg.type || null,
        ref_id: msg.ref_id || null,
        created_at: new Date().toISOString(),
    }));
    const { data, error } = await supabase.from("messages").insert(inserts);
    if (error) throw new Error(error.message);
    return data;
};

const markChatAsRead = async (chatId, userId) => {
    const { data: chat, error } = await supabase.from("chats").select("user1_id, user2_id").eq("id", chatId).single();
    if (error) throw error;
    if (!chat) throw new Error("Chat not found");

    let updateField = null;
    if (chat.user1_id === userId) updateField = "user1_read";
    else if (chat.user2_id === userId) updateField = "user2_read";
    else throw new Error("User not in chat");

    const { error: updateError } = await supabase
        .from("chats")
        .update({ [updateField]: true })
        .eq("id", chatId);
    if (updateError) throw updateError;
    return true;
};

const softDeleteMessages = async (messageIds, userId) => {
    // Traer los mensajes para verificar propiedad y chat_id
    const { data: messages, error } = await supabase
        .from("messages")
        .select("id,sender_id,chat_id,created_at,content")
        .in("id", messageIds);
    if (error) throw error;
    // Verifica que todos sean del usuario
    const forbidden = messages.some((m) => m.sender_id !== userId);
    if (forbidden) return { forbidden: true };

    // Actualiza los mensajes: cambia content a "//**Eliminado**//"
    const { data: updated, error: updateError } = await supabase
        .from("messages")
        .update({ content: "//**Eliminado**//" })
        .in("id", messageIds);
    if (updateError) throw updateError;

    // Para cada chat afectado, revisa si el last_message es uno de los eliminados
    const affectedChatIds = [...new Set(messages.map((m) => m.chat_id))];
    for (const chatId of affectedChatIds) {
        // Trae el chat
        const { data: chat, error: chatError } = await supabase
            .from("chats")
            .select("id,last_message")
            .eq("id", chatId)
            .single();
        if (chatError) continue;
        // Si el last_message es uno de los eliminados, busca el mensaje anterior válido
        const deletedContents = messages.filter((m) => m.chat_id === chatId).map((m) => m.content);
        if (deletedContents.includes(chat.last_message)) {
            // Si el last_message es uno de los eliminados, simplemente ponlo como "//**Eliminado**//"
            await supabase.from("chats").update({ last_message: "//**Eliminado**//" }).eq("id", chatId);
        }
    }

    return { updated };
};
const editMessage = async (messageId, userId, newContent) => {
    // Fetch the message to verify ownership
    const { data: message, error } = await supabase
        .from("messages")
        .select("id,sender_id,content")
        .eq("id", messageId)
        .single();
    if (error) throw error;
    if (!message) throw new Error("Message not found");
    if (message.sender_id !== userId) return { forbidden: true };
    // Update the message content and set edited=true
    const { data: updated, error: updateError } = await supabase
        .from("messages")
        .update({ content: newContent, edited: true })
        .eq("id", messageId)
        .select()
        .single();
    if (updateError) throw updateError;
    return { updated };
};

module.exports = {
    getUserChats,
    createOrGetChat,
    getChatMessages,
    sendMessage,
    sendBulkMessages,
    markChatAsRead,
    softDeleteMessages,
    editMessage,
};
