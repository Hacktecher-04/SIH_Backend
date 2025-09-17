const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch'); // npm install node-fetch
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tools = [
  {
    functionDeclarations: [
      {
        name: 'googleSearch',
        description:
          'Search Google for the latest information, courses, articles, or tutorials on any given topic.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'The text to search for.',
            },
          },
          required: ['query'],
        },
      },
    ],
  },
];

// 🔎 Real Google Search using Custom Search API
async function performGoogleSearch(query) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CX}&q=${encodeURIComponent(
    query
  )}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google search failed: ${res.status}`);
  const data = await res.json();

  const results =
    data.items?.map((item) => ({
      title: item.title,
      url: item.link,
    })) ?? [];

  return { results };
}

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  tools,
});

async function generateContentFromAI(goal, level, pace) {
  const chat = model.startChat();

  const masterPrompt = `Generate a detailed learning roadmap in JSON format.
Goal: "${goal}", Level: "${level}", Pace: "${pace}".
Use the googleSearch tool to find real working resources. 
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

  // handle Gemini’s tool calls
  const functionCalls = response.functionCalls?.();
  if (functionCalls?.length) {
    const call = functionCalls[0];
    if (call.name === 'googleSearch') {
      const apiResponse = await performGoogleSearch(call.args.query);
      const result2 = await chat.sendMessage([
        {
          functionResponse: {
            name: 'googleSearch',
            response: apiResponse,
          },
        },
      ]);
      response = result2.response;
    }
  }

  const text = response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : text;

  return JSON.parse(jsonString);
}

module.exports = generateContentFromAI;
