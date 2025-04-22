const friendService = require("../services/friendService");

const sendFriendRequest = async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await friendService.sendFriendRequest(userId, friendId);
        res.status(201).json({ message: "Solicitud de amistad enviada." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

const getFriendDecks = async (req, res) => {
    const { friendId } = req.params;
    try {
        const decks = await friendService.getFriendDecks(friendId);
        res.status(200).json(decks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

const getFriends = async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        console.error("User ID is missing in the request.");
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const friends = await friendService.getFriends(userId);
        res.status(200).json(friends);
    } catch (error) {
        console.error("Error fetching friends:", error.message);
        res.status(500).json({ error: "Failed to fetch friends" });
    }
};

const getAcceptedFriends = async (req, res) => {
    const { userId } = req.params; // Extraer userId de los parámetros de la ruta

    try {
        const friends = await friendService.getAcceptedFriends(userId);
        res.status(200).json(friends);
    } catch (err) {
        console.error("Error fetching accepted friends:", err);
        res.status(500).json({ error: err.message });
    }
};

const acceptFriendRequest = async (req, res) => {
    const { userId } = req.body; // Extraer userId del cuerpo de la solicitud
    const { friendId } = req.params;

    try {
        const result = await friendService.acceptFriendRequest(userId, friendId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error in acceptFriendRequest controller:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

const removeFriend = async (req, res) => {
    const { friendId } = req.params;
    const userId = req.user?.id || req.body.userId; // Obtener userId del usuario autenticado o del cuerpo de la solicitud

    console.log("Received request to remove friend:", { userId, friendId }); // Debugging log

    if (!userId || !friendId) {
        console.error("Missing userId or friendId:", { userId, friendId });
        return res.status(400).json({ error: "Both userId and friendId are required." });
    }

    try {
        await friendService.removeFriend(userId, friendId);
        res.status(200).json({ message: "Friend removed successfully." });
    } catch (err) {
        console.error("Error removing friend:", err);
        res.status(500).json({ error: "Failed to remove friend." });
    }
};

module.exports = {
    sendFriendRequest,
    getFriendDecks,
    getFriends,
    acceptFriendRequest,
    removeFriend,
    getAcceptedFriends,
};
