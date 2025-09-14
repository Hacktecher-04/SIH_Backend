const { GoogleGenerativeAI } = require('@google/generative-ai');
const Roadmap = require('../models/roadmap.model');
const User = require('../models/user.model');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const tools = [
  {
    functionDeclarations: [
      {
        name: "googleSearch",
        description: "Searches Google for the latest information, courses, articles, or tutorials on any given topic.",
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
  console.log(`Searching Google for: "${query}"`);
  return {
    results: [
      { title: "Official Node.js Guide", url: "https://nodejs.org/en/docs/guides" },
      { title: "Express.js 'Hello World' Example", url: "https://expressjs.com/en/starter/hello-world.html" },
    ],
  };
}

async function generateContentFromAI(goal, level, pace) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    tools: tools, // Tell the model which tools are available
  });

  const chat = model.startChat();
  const masterPrompt = `
     Generate a detailed learning roadmap in JSON format.
      Goal: "${goal}", Level: "${level}", Pace: "${pace}".
      The JSON output MUST be only the JSON object, with this structure:
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
      }
    `;

  // 1. Send the first message
  const result = await chat.sendMessage(masterPrompt);
  let response = result.response;


  // 2. Check if the model has requested a function call
  const functionCalls = response.functionCalls();
  if (functionCalls && functionCalls.length > 0) {
    console.log("Gemini is calling a function:", functionCalls[0].name);

    // 3. If yes, execute that function
    const call = functionCalls[0];
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
      // Now, update the response
      response = result2.response;
    }
  }

  const responseText = response.text();
  const cleanedJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanedJsonString);
}

const createRoadmap = async (goal, level, pace, userId) => {
  const roadmapDataFromAI = await generateContentFromAI(goal, level, pace);
  const completeRoadmapData = {
    ...roadmapDataFromAI,
    userId,
    inputGoal: goal,
    inputLevel: level,
    inputPace: pace,
  };
  const newRoadmap = await Roadmap.create(completeRoadmapData);
  await User.findByIdAndUpdate(userId, { activeRoadmapId: newRoadmap._id });
  return newRoadmap;
};


const getUserRoadmaps = async (userId) => {
  return await Roadmap.find({ userId }).select('title description createdAt');
};

const getRoadmapById = async (roadmapId, userId) => {
  const roadmap = await Roadmap.findById(roadmapId);
  if (!roadmap) {
    throw new Error("Roadmap not found.");
  }
  console.log(roadmap.userId.toString());
  console.log(userId);
  if (roadmap.userId.toString() !== userId.toString()) {
    throw new Error("You are not authorized to view this roadmap.");
  }

  return roadmap;
};

module.exports = {
  createRoadmap,
  getUserRoadmaps,
  getRoadmapById,
};