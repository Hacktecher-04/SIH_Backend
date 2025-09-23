const { GoogleGenerativeAI } = require("@google/generative-ai");
const searchAndFilter = require("../helpers/googleSearch");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
});

async function generateContentFromAI(careerName) {
    const chat = model.startChat();

    const masterPrompt = `
    You are a world-class career research assistant. Your sole purpose is to provide a
structured, high-quality summary for the career: ${careerName}. You MUST respond with
only a single, valid JSON object. The JSON object must have: "career_title" (string), "icon"
(a PascalCase string from the 'react-icons/fa' library, e.g., "FaShieldAlt"), "description"
(string), "key_responsibilities" (array of 3-4 strings), "core_skills" (array of 4-5 strings),
and "deep_dive_url" (a string URL to a single, authoritative resource like MDN or a
professional body, not just Wikipedia)
`;

    let result = await chat.sendMessage(masterPrompt);
    let response = result.response;


    const responseText = response.text().trim();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : responseText;
    return JSON.parse(jsonString);
}

async function generateSuggestSkills(industry) {
    const chat = model.startChat();

    const masterPrompt = `
You are an expert industry analyst. For the industry "{industry}", generate a strategic skill
breakdown. You MUST respond with only a single, valid JSON object. The JSON object
must have: "title" (string, e.g., "Top Skills for ${industry}"), "foundational_skills"
({description: string, tags: array of strings}), "in_demand_skills" ({description: string, tags:
array of strings}), and "rising_stars" ({description: string, tags: array of strings}).
`;

    let result = await chat.sendMessage(masterPrompt);
    let response = result.response;


    const responseText = response.text().trim();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : responseText;
    return JSON.parse(jsonString);
}

module.exports = { generateContentFromAI, generateSuggestSkills };