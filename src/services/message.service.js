const { GoogleGenerativeAI } = require("@google/generative-ai");
const messageModel = require('../models/message.model');
const chatService = require('./chat.service');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Retry wrapper for temporary errors (503)
async function retry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Retry attempt ${i + 1} failed, retrying in ${delay * (i + 1)}ms...`);
      await new Promise(res => setTimeout(res, delay * (i + 1)));
    }
  }
}

// ---- Generate AI message ----
async function generateMessage(chatData, history) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Stable model

  const chat = model.startChat({
    history,
    generationConfig: { maxOutputTokens: 1000 }
  });

  const result = await retry(() => chat.sendMessage(chatData));
  const parts = result.response.candidates?.[0]?.content?.parts || [];
  return parts.map(p => p.text || "").join("").trim();
}

// ---- Generate title ----
async function generateTitle(message) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const chat = model.startChat({ generationConfig: { maxOutputTokens: 50 } });

  const prompt = `Generate a short, concise title (3-5 words) for the following user message: "${message}"`;

  const result = await retry(() => chat.sendMessage({ role: "user", parts: [{ text: prompt }] }));
  const parts = result.response.candidates?.[0]?.content?.parts || [];
  return parts.map(p => p.text || "").join("").replace(/["']/g, "").trim();
}

// ---- Save + reply ----
const createMessage = async (message, chatId, userId) => {
  try {
    let currentChat;

    if (!chatId || chatId === 'null' || chatId === 'undefined') {
      const title = await generateTitle(message);
      currentChat = await chatService.createChat(userId, title);
      chatId = currentChat._id;
    } else {
      currentChat = await chatService.getChatId(chatId);
      if (!currentChat) throw new Error("Chat not found");
    }

    // Save user message
    await messageModel.create({ userId, chatId, role: 'user', content: message });

    // Get history
    const history = await messageModel.find({ chatId }).sort({ createdAt: 1 });
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Generate AI response
    const aiResponse = await generateMessage(message, formattedHistory);

    // Save AI message
    await messageModel.create({ userId, chatId, role: 'ai', content: aiResponse });

    return { message: aiResponse, chatId, title: currentChat.chat_title };

  } catch (error) {
    console.error("Error in createMessage:", error);
    throw new Error(error.message);
  }
};

const getMessages = async (chatId) => {
  return messageModel.find({ chatId }).sort({ createdAt: 1 });
};

module.exports = { createMessage, getMessages };
