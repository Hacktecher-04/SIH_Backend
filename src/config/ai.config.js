const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function createRoadmap(tools) {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        tools,
    });

    return model;
}

module.exports = {
    createRoadmap,
}