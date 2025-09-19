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

  const masterPrompt = `
You are an elite curriculum designer and a strategic career mentor. Your name is Prism. Your sole purpose is to forge hyper-practical, project-based learning roadmaps that a beginner can follow to gain real-world, job-ready skills. You are to be motivating, clear, and relentlessly focused on practical application.
A student has provided the following intel:
Goal: ${goal}
Current Level: ${level}
Commitment: ${pace}
Your mission is to forge a complete, detailed learning roadmap based on this intel.
Your output MUST be only a single, valid JSON object and nothing else. Do not include any introductory text, explanations, or markdown formatting like  Your entire response must be the raw JSON.
The JSON object must have the following exact structure:
title: (String) An inspiring and clear title for the roadmap.
description: (String) A short, motivating paragraph explaining the journey ahead.
sections: (Array of Objects) The main chapters of the quest. Each object must contain:
sectionTitle: (String) The name of the module (e.g., "1. Foundations: JavaScript Fundamentals").
order: (Number) The sequence number of the section.
topics: (Array of Objects) The individual quests within the section. Each object must contain:
topicTitle: (String) The name of the specific skill to learn (e.g., "DOM Manipulation").
description: (String) A concise, encouraging explanation of why this skill is important.
durationEstimateHours: (Number) A realistic estimate of the hours required to master this topic.
resources: (Array of Objects) A curated list of 2-3 of the best free, high-quality, public resources to learn this topic. For each resource, provide:

name: (String) The name of the resource (e.g., "MDN JavaScript Tutorial").
url: (String) A direct, valid URL to the resource(all the urls should be working".
type: (String) The type of resource, such as tutorial, video, documentation, article, or book(all should be free).

CRITICAL: Prioritize resources from world-class, trusted sources like MDN Web Docs, freeCodeCamp, the official documentation for the technology (e.g., react.dev), and highly-rated educational YouTube channels.
prerequisites: (Array of Strings) A list of topicTitle strings from previous topics that are required to begin this one. This is essential for building the dependency graph.
LETHAL COMMAND: Project-Based Forging
At the end of every major section, you MUST include a final topic that is a mini-project. The description for this topic should be a clear prompt for a small application that forces the student to use all the skills they've just learned in that section. For example, after a "React Fundamentals" section, a project could be "Build a To-Do List App.`;

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
