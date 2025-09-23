const { GoogleGenerativeAI } = require("@google/generative-ai");
const messageModel = require('../models/message.model');
const chatModel = require('../models/chat.model');
const chatService = require('./chat.service');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_CHAT_API_KEY);

async function generateMessage(chatData, history) {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
    });
    const chat = model.startChat({
        history: history,
        generationConfig: {
            maxOutputTokens: 1000,
        },
    });
    const result = await chat.sendMessage(chatData);
    const response = result.response;
    const text = response.text();
    return text;
}

async function generateTitle(message) {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
    });
    const prompt = `Generate a short, concise title (3-5 words) for the following user message: "${message}"`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return text.replace(/[""]/g, ''); // Remove quotes from the title
}

const createMessage = async (message, chatId, userId) => {
    try {
        let currentChat;
        // If no chatId, it's a new chat
        if (!chatId || chatId === 'null' || chatId === 'undefined') {
            const title = await generateTitle(message);
            currentChat = await chatService.createChat(userId, title);
            chatId = currentChat._id;
        } else {
            currentChat = await chatService.getChatId(chatId);
            if (!currentChat) {
                throw new Error("Chat not found");
            }
        }

        // Save user message
        await messageModel.create({
            userId,
            chatId,
            role: 'user',
            content: message
        });

        // Get chat history
        const history = await messageModel.find({ chatId }).sort({ createdAt: 1 });
        const formattedHistory = history.map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Generate AI response
        const aiResponse = await generateMessage(message, formattedHistory);

        // Save AI message
        await messageModel.create({
            userId,
            chatId,
            role: 'ai',
            content: aiResponse
        });

        return {
            message: aiResponse,
            chatId: chatId,
            title: currentChat.chat_title
        };

    } catch (error) {
        console.error("Error in createMessage:", error);
        throw new Error(error.message);
    }
};

const getMessages = async (chatId) => {
    try {
        const messages = await messageModel.find({ chatId }).sort({ createdAt: 1 });
        return messages;
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = {
    createMessage,
    getMessages
};
