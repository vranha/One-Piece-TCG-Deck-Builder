const supabase = require("../services/supabaseClient");

const getFriends = async (userId) => {
    const { data: friends, error } = await supabase.from("friends").select("friend_id").eq("user_id", userId);

    if (error) throw error;
    return friends;
};

const acceptFriendRequest = async (userId, friendId) => {
    const { data, error } = await supabase
        .from("friends")
        .update({ status: "accepted" })
        .eq("user_id", friendId)
        .eq("friend_id", userId);

    if (error) throw error;
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

module.exports = {
    getFriends,
    acceptFriendRequest,
    removeFriend,
    sendFriendRequest,
    getFriendDecks,
};
