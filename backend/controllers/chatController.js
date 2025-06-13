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

const sendBulkMessages = async (req, res) => {
    const { chatId } = req.params;
    const { messages, sender_id } = req.body;
    if (!Array.isArray(messages) || !sender_id) {
        return res.status(400).json({ error: "Missing messages array or sender_id" });
    }
    try {
        const result = await chatService.sendBulkMessages(chatId, sender_id, messages);
        res.json({ success: true, inserted: result });
    } catch (e) {
        res.status(500).json({ error: e.message });
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

const softDeleteMessages = async (req, res) => {
    try {
        const { messageIds, userId } = req.body;
        if (!Array.isArray(messageIds) || !userId) {
            return res.status(400).json({ error: "Missing messageIds or userId" });
        }
        // Solo puede eliminar mensajes propios
        const result = await chatService.softDeleteMessages(messageIds, userId);
        if (result.forbidden) {
            return res.status(403).json({ error: "No tienes permiso para eliminar estos mensajes" });
        }
        res.json({ success: true, updated: result.updated });
    } catch (err) {
        res.status(500).json({ error: "Error eliminando mensajes", details: err.message || err });
    }
};

const editMessage = async (req, res) => {
    try {
        const { messageId, userId, newContent } = req.body;
        if (!messageId || !userId || typeof newContent !== "string") {
            return res.status(400).json({ error: "Missing messageId, userId or newContent" });
        }
        const result = await chatService.editMessage(messageId, userId, newContent);
        if (result.forbidden) {
            return res.status(403).json({ error: "No tienes permiso para editar este mensaje" });
        }
        res.json({ success: true, updated: result.updated });
    } catch (err) {
        res.status(500).json({ error: "Error editando mensaje", details: err.message || err });
    }
};

module.exports = {
    sendMessage,
    sendBulkMessages,
    getChatMessages,
    createOrGetChat,
    getUserChats,
    markChatAsRead,
    softDeleteMessages,
    editMessage,
};
