// generateContentFromAI.js
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const searchAndFilter = require("../helpers/googleSearch");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tools = [
  {
    functionDeclarations: [
      {
        name: "googleSearch",
        description: "Searches Google dynamically for working links.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "Search query." },
          },
          required: ["query"],
        },
      },
    ],
  },
];

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  tools,
});

async function generateContentFromAI(goal, level, pace) {
  const chat = model.startChat();

  const masterPrompt = `Generate a detailed learning roadmap in JSON format.
Goal: "${goal}", Level: "${level}", Pace: "${pace}".
Output ONLY JSON with this structure:
{
  "title": "A concise title",
  "description": "A brief overview.",
  "sections": [
    {
      "sectionTitle": "Section 1 Title",
      "order": 1,
      "topics": [
        {
          "topicTitle": "Topic 1 Title",
          "description": "Topic description.",
          "durationEstimateHours": 10,
          "resources": [{"name": "Resource", "url": "https://example.com", "type": "video"}],
          "prerequisites": []
        }
      ]
    }
  ]
}`;

  let result = await chat.sendMessage(masterPrompt);
  let response = result.response;

  const functionCalls = response.functionCalls?.();
  if (functionCalls?.length) {
    const call = functionCalls[0];
    if (call.name === "googleSearch") {
      const workingUrls = await searchAndFilter(call.args.query);

      const result2 = await chat.sendMessage([
        {
          functionResponse: {
            name: "googleSearch",
            response: { results: workingUrls },
          },
        },
      ]);
      response = result2.response;
    }
  }

  const responseText = response.text().trim();
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : responseText;

  return JSON.parse(jsonString);
}

module.exports = generateContentFromAI;
