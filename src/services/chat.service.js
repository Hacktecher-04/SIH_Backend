const chatModel = require('../models/chat.model');
const messageModel = require('../models/message.model');

const createChat = async (userId, chat_title) => {
    try {
        if (!chat_title) {
            throw new Error("title not found");
        }
        const chat = await chatModel.create({
            userId,
            chat_title
        })
        return chat
    } catch (error) {
        throw new Error(error.message)
    }
}

const getChats = async (userId) => {
    try {
        const chat = await chatModel.findOne({userId})
        if (!chat) {
            throw new Error("chat not found");
        }
        return chat
    } catch (error) {
        throw new Error(error.message)
    }
}

const getChatId = async (chatId) => {
    try {
        const chat = await chatModel.findById({ _id : chatId })
        if (!chat) {
            throw new Error("chat not found");
        }
        return chat
    } catch (error) {
        throw new Error(error.message);
    }
}

const updateChat = async (chatId, chat_title) => {
    try {
        if (!chat_title) {
            throw new Error("title not found");
        }
        const chat = await chatModel.findOneAndUpdate({ _id: chatId }, {chat_title : chat_title}, { new: true })
        if (!chat) {
            throw new Error("chat not found");
        }
        return chat
    } catch (error) {
        throw new Error(error.message);
    }
}

const deleteChat = async (chatId) => {
    try {
        await chatModel.findOneAndDelete({ _id: chatId })
        return {
            success: true,
            message : "Chat deleted successfully"
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = {
    createChat,
    getChats,
    getChatId,
    updateChat,
    deleteChat
}