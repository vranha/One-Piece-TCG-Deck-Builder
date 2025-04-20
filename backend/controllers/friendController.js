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
    const { userId } = req.query; // Get userId from query params
    const { status } = req.query; // Get status from query params

    try {
        const friends = await friendService.getFriends(userId, status);
        res.status(200).json(friends);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

const acceptFriendRequest = async (req, res) => {
    const { friendId } = req.params;
    const { userId } = req.user; // Assuming userId is available in the authenticated user object
    try {
        await friendService.acceptFriendRequest(userId, friendId);
        res.status(200).json({ message: "Friend request accepted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
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
};
