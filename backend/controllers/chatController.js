const chatService = require("../services/chatService");

const getUserChats = async (req, res) => {
    try {
        // Ahora toma el userId de los params
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ error: "Missing userId param" });
        }
        const chats = await chatService.getUserChats(userId);
        res.json(chats);
    } catch (err) {
        console.error("Error in getUserChats:", err);
        res.status(500).json({ error: "Error fetching chats", details: err.message || err });
    }
};
const createOrGetChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.body;
        const chat = await chatService.createOrGetChat(userId, otherUserId);
        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: "Error creating chat" });
    }
};

const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await chatService.getChatMessages(chatId);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: "Error fetching messages" });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const senderId = req.user.id;
        const { content } = req.body;
        const message = await chatService.sendMessage(chatId, senderId, content);
        res.json(message);
    } catch (err) {
        res.status(500).json({ error: "Error sending message" });
    }
};

module.exports = {
    sendMessage,
    getChatMessages,
    createOrGetChat,
    getUserChats,
};
