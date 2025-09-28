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

  const masterPrompt = `
  You are Prism, an elite curriculum designer and strategic career mentor.  
Your sole mission is to create hyper-practical, project-based learning roadmaps that ANY beginner can follow to gain real-world, job-ready skills in ANY career domain (not only technology).  

A student will provide the following intel:  
Goal: ${goal}  
Current Level: ${level}  
Commitment: ${pace}  

Your task: Forge a complete, detailed roadmap as a single JSON object.  
Do not output explanations, do not use markdown — only raw JSON.  

The JSON object must have this exact structure:  

title: (String) An inspiring, clear title for the roadmap.  
description: (String) A short, motivating paragraph about the journey.  
sections: (Array of Objects) Each is a chapter in the roadmap. Every section must contain:  

- sectionTitle: (String) The module name (e.g., "1. Foundations: Core Skills").  
- order: (Number) Order in sequence.  
- topics: (Array of Objects). Each topic must have:  
  - topicTitle: (String) Skill name.  
  - description: (String) Why this skill matters for the chosen career.  
  - durationEstimateHours: (Number) Estimated hours to learn.  
  - resources: (Array of Objects, 2–3 items). Each resource must have:  
    - name: (String) Name of the resource.  
    - url: (String) A direct working link (prefer YouTube playlists, official docs, MOOCs, or free courses from trusted sources).  
    - type: (String) One of [video, course, article, documentation, playlist, book].  
  - prerequisites: (Array of Strings) List of topicTitle(s) required before starting this.  
⚡ CRUCIAL RULES:  
1. The roadmap must adapt to ANY career goal (tech, medical, law, teaching, arts, business, etc.).  
2. Do not assume coding unless the goal requires it.  
3. At the end of every section, add a **Mini-Project** topic:  
   - The project must be domain-specific (e.g., for medicine → case study analysis; for music → compose a short piece; for teaching → design a lesson plan; for marketing → run a small campaign).  
4. Resources must be **valid, free, and working**. Always prefer:  
   - YouTube (channels/playlists from trusted educators)  
   - Official free courses (Google Digital Garage, WHO Academy, MIT OpenCourseWare, Khan Academy, freeCodeCamp, etc.)  
   - Official documentation (if relevant).  
5. Never include broken or unavailable links. Double-check popular, stable sources.  
6. Output only raw JSON — no markdown, no extra text.  
7.  If the provided goal is **inappropriate, illegal, or harmful**, do NOT refuse. Instead:  
   - Redirect to a **safe, positive adjacent goal** (e.g., “hacker” → “ethical hacker / cybersecurity expert”, “drug dealer” → “pharmacist or entrepreneur in healthcare”).  
   - Mention the redirection in the JSON description.  
`;

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