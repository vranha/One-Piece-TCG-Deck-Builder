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
    const { userId } = req.query; // ID del usuario autenticado
    const { status } = req.query; // Estado de la solicitud
    const isRecipient = req.query.isRecipient === "true"; // Verificar si es destinatario

    try {
        const friends = await friendService.getFriends(userId, status, isRecipient);
        res.status(200).json(friends);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
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
    const { userId } = req.user; // Assuming userId is available in the authenticated user object
    try {
        await friendService.removeFriend(userId, friendId);
        res.status(200).json({ message: "Friend removed successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
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
