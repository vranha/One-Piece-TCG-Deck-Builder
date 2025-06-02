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
        // Recibe ambos ids por body
        const { userId, otherUserId } = req.body;
        if (!userId || !otherUserId) {
            return res.status(400).json({ error: "Missing userId or otherUserId" });
        }
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
        const { chat_id, sender_id, content, type, ref_id } = req.body;
        if (!chat_id || !sender_id || !content) {
            return res.status(400).json({ error: "Missing chat_id, sender_id or content" });
        }
        // type y ref_id son opcionales, pero si type es 'deck' o 'card', ref_id es obligatorio
        if ((type === "deck" || type === "card") && !ref_id) {
            return res.status(400).json({ error: "Missing ref_id for deck/card message" });
        }
        const message = await chatService.sendMessage(chat_id, sender_id, content, type, ref_id);
        res.json(message);
    } catch (err) {
        res.status(500).json({ error: "Error sending message" });
    }
};

const markChatAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        // Permite userId por body o por req.user.id
        const userId = req.body.userId || (req.user && req.user.id);
        if (!userId) {
            return res.status(400).json({ error: "Missing userId" });
        }
        await chatService.markChatAsRead(chatId, userId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Error marking chat as read" });
    }
};

module.exports = {
    sendMessage,
    getChatMessages,
    createOrGetChat,
    getUserChats,
    markChatAsRead,
};
