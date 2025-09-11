const  { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI(process.env.GOOGLE_API_KEY);

async function genratePrompt(prompt) {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        prompt: {
            text: prompt,
        },
        temperature: 0.2,
    })
    return response.result;
}

module.exports = genratePrompt;