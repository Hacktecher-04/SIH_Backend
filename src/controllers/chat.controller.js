const chatService = require('../services/chat.service')
const  messageService  = require('../services/message.service')

const getChat = async (req, res) => {
    try {
        const chat = await chatService.getChats(req.user._id);
        if (!chat) {
            throw new Error("chat not found");
        }
        res.status(200).json({chat});
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

const getChatId = async (req, res) => {
    try {
        const chat = await chatService.getChatId(req.params.id);
        res.status(200).json(chat);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

const updateChat = async (req, res) => {
    try {
        const chat = await chatService.updateChat(req.params.id, req.body.chat_title);
        res.status(200).json(chat);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

const deleteChat = async (req, res) => {
    try {
        const chat = await chatService.deleteChat(req.params.id);
        res.status(200).json(chat);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

const getMessages = async (req, res) => {
    try {
        const messages = await messageService.getMessages(req.params.chatId);
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

module.exports = {
    getChat,
    getChatId,
    updateChat,
    deleteChat,
    getMessages
}