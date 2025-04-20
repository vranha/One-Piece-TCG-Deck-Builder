const { supabase } = require("../services/supabaseClient"); // Ensure correct import

const getFriends = async (userId, status, isRecipient = false) => {
    let query = supabase.from("friends").select("friend_id, user_id, users!friends_user_id_fkey(username, avatar_url)");

    if (isRecipient) {
        query = query.eq("friend_id", userId); // Buscar donde el usuario es el destinatario
    } else {
        query = query.eq("user_id", userId); // Buscar donde el usuario es el remitente
    }

    if (status) {
        query = query.eq("status", status);
    }

    const { data: friends, error } = await query;

    if (error) throw error;
    return friends;
};

const getAcceptedFriends = async (userId) => {
    let query = supabase
        .from("friends")
        .select(
            `
            id,
            user_id,
            friend_id,
            status,
            users:user_id(username, avatar_url),
            friend:friend_id(username, avatar_url)
        `
        )
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq("status", "accepted");

    const { data: friends, error } = await query;

    if (error) throw error;

    // Transformar los datos para devolver siempre los datos del "otro usuario"
    const transformedFriends = friends.map((friend) => {
        const isSender = friend.user_id === userId;
        return {
            id: friend.id,
            user: isSender
                ? { id: friend.friend_id, username: friend.friend.username, avatar_url: friend.friend.avatar_url }
                : { id: friend.user_id, username: friend.users.username, avatar_url: friend.users.avatar_url },
        };
    });

    return transformedFriends;
};

const acceptFriendRequest = async (userId, friendId) => {
    if (!userId || !friendId) {
        console.error("Both userId and friendId are required.", { userId, friendId }); // Log detallado
        throw new Error("Both userId and friendId are required.");
    }

    const { data, error } = await supabase
        .from("friends")
        .update({ status: "accepted" })
        .eq("user_id", friendId)
        .eq("friend_id", userId);

    if (error) {
        console.error("Error updating friend request:", error);
        throw error;
    }

    if (!data || data.length === 0) {
        console.warn("No friend request found to accept.");
    }

    return data;
};

const removeFriend = async (userId, friendId) => {
    const { error } = await supabase
        .from("friends")
        .delete()
        .or(`user_id.eq.${userId},friend_id.eq.${friendId}`)
        .or(`user_id.eq.${friendId},friend_id.eq.${userId}`);

    if (error) throw error;
};

const sendFriendRequest = async (userId, friendId) => {
    const { data, error } = await supabase.from("friends").insert([{ user_id: userId, friend_id: friendId }]);

    if (error) throw error;
    return data;
};

const getFriendDecks = async (friendId) => {
    const { data: decks, error } = await supabase
        .from("decks")
        .select("*")
        .eq("user_id", friendId)
        .eq("is_public", true);

    if (error) throw error;
    return decks;
};

const getAllFriends = async (userId) => {
    const { data: friends, error } = await supabase
        .from("friends")
        .select("friend_id, users!friends_friend_id_fkey(username, avatar_url)")
        .eq("user_id", userId);

    if (error) throw error;

    return friends.map((friend) => ({
        id: friend.friend_id,
        username: friend.users.username,
        avatar_url: friend.users.avatar_url,
    }));
};

module.exports = {
    getFriends,
    acceptFriendRequest,
    removeFriend,
    sendFriendRequest,
    getFriendDecks,
    getAcceptedFriends,
    getAllFriends,
};
