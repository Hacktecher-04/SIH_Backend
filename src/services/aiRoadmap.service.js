const { GoogleGenAI } = require("@google/genai");
const masterPrompts = require("../prompts/roadmap.prompt"); // adjust path as needed

// Initialize GenAI client (it will pick up your API key via env)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateContentFromAI(goal, level, pace) {

  const prompt = masterPrompts(goal, level, pace);

  // call Gemini via genai SDK
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash", // or whichever model you prefer
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  // response.text gives the raw text output
  const text = response.text.trim();
  // Try to extract JSON part
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : text;

  console.log(jsonString)
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("Failed to parse JSON from Gemini output:", err, jsonString);
    throw new Error("Gemini returned non-JSON or malformed output");
  }
}

module.exports =  generateContentFromAI;
