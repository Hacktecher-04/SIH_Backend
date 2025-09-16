const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tools = [
  {
    functionDeclarations: [
      {
        name: "googleSearch",
        description:
          "Searches Google for the latest information, courses, articles, or tutorials on any given topic.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "The text to search for.",
            },
          },
          required: ["query"],
        },
      },
    ],
  },
];

async function performGoogleSearch(query) {
  // Keep logs lightweight for speed
  console.info(`🔍 Google Search: "${query}"`);
  // Simulated fast response
  return {
    results: [
      {
        title: "Official Node.js Guide",
        url: "https://nodejs.org/en/docs/guides",
      },
      {
        title: "Express.js 'Hello World' Example",
        url: "https://expressjs.com/en/starter/hello-world.html",
      },
    ],
  };
}

// Make model & chat reusable for speed
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  tools,
});

async function generateContentFromAI(goal, level, pace) {
  const chat = model.startChat(); // fresh chat each time for clean context

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

  // 1. Send the first message
  let result = await chat.sendMessage(masterPrompt);
  let response = result.response;

  // 2. Handle function calls fast
  const functionCalls = response.functionCalls?.();
  if (functionCalls?.length) {
    const call = functionCalls[0];
    console.info(`⚡ Gemini called: ${call.name}`);

    if (call.name === "googleSearch") {
      const apiResponse = await performGoogleSearch(call.args.query);

      // 4. Send the search results back to the model
      const result2 = await chat.sendMessage([
        {
          functionResponse: {
            name: "googleSearch",
            response: apiResponse,
          },
        },
      ]);
      response = result2.response;
    }
  }

  // 3. Directly parse JSON without heavy regex
  const responseText = response.text().trim();
  // The model already outputs JSON; just strip ``` if present
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : responseText;

  return JSON.parse(jsonString);
}

module.exports = generateContentFromAI;