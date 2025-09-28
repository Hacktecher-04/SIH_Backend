require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const searchAndFilter = require("../helpers/googleSearch");
const masterPrompts = require('../prompts/roadmap.prompt')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tools = [
  {
    functionDeclarations: [
      {
        name: "googleSearch",
        description: "Searches Google dynamically for working links.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query." },
          },
          required: ["query"],
        },
      },
    ],
  },
];

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  tools,
});

async function generateContentFromAI(goal, level, pace) {
  console.log("Generating roadmap for:", { goal, level, pace });
  const chat = model.startChat({ tools })

  const masterPrompt = masterPrompts(goal, level, pace)

  let result = await chat.sendMessage({ role: "user", parts: [{ text: masterPrompt }] });
  
  if (result.response.functionCalls && result.response.functionCalls.length) {
    const call = result.response.functionCalls[0];
    if (call.name === "googleSearch") {
      // actually run your own Google search helper
      const workingUrls = await searchAndFilter(call.args.query);
      // send the function response back to Gemini
      result = await chat.sendMessage({
        role: "function",
        parts: [
          {
            functionResponse: {
              name: "googleSearch",
              response: { results: workingUrls },
            },
          },
        ],
      });
    }
  }

  // extract plain text from Gemini’s reply
  const parts = result.response.candidates?.[0]?.content?.parts || [];
  const text = parts.map(p => p.text || "").join("").trim();

  // pull JSON out of the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : text;

  return JSON.parse(jsonString);
}

module.exports = generateContentFromAI