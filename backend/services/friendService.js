const { supabase } = require("../services/supabaseClient"); // Ensure correct import

const getFriends = async (userId) => {
    console.log("Fetching friends for userId:", userId); // Log userId for debugging

    const { data: friends, error } = await supabase
        .from("friends")
        .select(
            `
            id,
            user_id,
            friend_id,
            status,
            users:user_id(id, username, avatar_url),
            friend:friend_id(id, username, avatar_url)
        `
        )
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) {
        console.error("Error fetching friends:", error.message);
        throw error;
    }

    // Transform the data to include the required fields
    const transformedFriends = friends.map((friend) => {
        const isSender = friend.user_id === userId;
        return {
            id: isSender ? friend.friend_id : friend.user_id, // The ID of the other user
            username: isSender ? friend.friend.username : friend.users.username, // Correct username
            avatar_url: isSender ? friend.friend.avatar_url : friend.users.avatar_url, // Correct avatar_url
            status: friend.status, // The status of the friendship
            isSender, // Whether the current user sent the request
        };
    });

    return transformedFriends;
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
    if (!userId || !friendId) {
        console.error("Missing userId or friendId:", { userId, friendId });
        throw new Error("Both userId and friendId are required.");
    }

    console.log("Attempting to remove friend with userId:", userId, "and friendId:", friendId); // Debugging log

    // Verificar si existe un registro con cualquiera de las combinaciones posibles
    const { data: existingFriends, error: fetchError } = await supabase
        .from("friends")
        .select("*")
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`); // Buscar en ambas combinaciones posibles

    if (fetchError) {
        console.error("Error fetching friend:", fetchError); // Log the error from Supabase
        throw fetchError;
    }

    if (!existingFriends || existingFriends.length === 0) {
        console.warn("No friend found with the given userId and friendId.");
        throw new Error("Friend not found.");
    }

    // Eliminar todos los registros encontrados
    const { error: deleteError } = await supabase
        .from("friends")
        .delete()
        .in(
            "id",
            existingFriends.map((friend) => friend.id)
        ); // Usar los IDs de los registros encontrados

    if (deleteError) {
        console.error("Error removing friend:", deleteError); // Log the error from Supabase
        throw deleteError;
    }

    console.log("Friend successfully removed from database:", existingFriends); // Debugging log
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
