const { GoogleGenerativeAI } = require("@google/generative-ai");
const searchAndFilter = require("../helpers/googleSearch");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

async function generateContentFromAI(careerName) {
  const chat = model.startChat();

  const masterPrompt = `
   You are a world-class career research assistant.  
Your sole purpose is to provide a structured, high-quality summary for the career: "${careerName}".  
You MUST respond with only a single, valid JSON object.  

The JSON object must have exactly the following structure:

{
  "career_title": "${careerName}",
  "icon": "FaSomeIcon", 
  // A single PascalCase icon name from 'react-icons/fa' (e.g., "FaShieldAlt", "FaUserTie")
  "description": "Brief, clear description of what the ${careerName} role entails.",
  "key_responsibilities": [
    "Responsibility 1",
    "Responsibility 2",
    "Responsibility 3",
    "Responsibility 4"
  ],
  "core_skills": [
    "Core Skill 1",
    "Core Skill 2",
    "Core Skill 3",
    "Core Skill 4",
    "Core Skill 5"
  ],
  "deep_dive_url": "https://authoritative-resource-url-for-${careerName}"
  // Provide a single, authoritative resource URL (e.g., MDN, official professional body, or industry site—not Wikipedia)
}

`;

  let result = await chat.sendMessage(masterPrompt);
  let response = result.response;



  const responseText = response.text().trim();
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : responseText;
  console.log(jsonString);
  return JSON.parse(jsonString);
}

async function generateSuggestSkills(industry) {
  const chat = model.startChat();

  const masterPrompt = `
    You are an expert industry analyst. For the industry "${industry}", generate a strategic skill breakdown.  
You MUST respond with only a single, valid JSON object.  

The JSON object must have exactly the following structure:  
{
  "title": "Top Skills for ${industry}",
  "foundational_skills": {
    "description": "Brief description of foundational skills in ${industry}",
    "tags": ["Skill1", "Skill2", "Skill3"]
  },
  "in_demand_skills": {
    "description": "Brief description of currently in-demand skills in ${industry}",
    "tags": ["Skill1", "Skill2", "Skill3"]
  },
  "rising_stars": {
    "description": "Brief description of emerging/rising skills in ${industry}",
    "tags": ["Skill1", "Skill2", "Skill3"]
  }
}

`;

  let result = await chat.sendMessage(masterPrompt);
  let response = result.response;


  const responseText = response.text().trim();
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : responseText;
  return JSON.parse(jsonString);
}

module.exports = { generateContentFromAI, generateSuggestSkills };