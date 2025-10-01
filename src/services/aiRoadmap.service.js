const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { GoogleGenAI } = require("@google/genai");
const masterPrompts = require("../prompts/roadmap.prompt"); // adjust path as needed
const axios = require("axios");

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

  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("Failed to parse JSON from Gemini output:", err, jsonString);
    throw new Error("Gemini returned non-JSON or malformed output");
  }
}

puppeteer.use(StealthPlugin());

let browser;

async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu"
      ]
    });
  }
  return browser;
}

/* ============= 🔹 YouTube Search 🔹 ============= */
async function searchYouTube(query) {
  const url = "https://www.googleapis.com/youtube/v3/search";
  const { data } = await axios.get(url, {
    params: {
      part: "snippet",
      q: query,
      maxResults: 5,
      type: "video",
      key: process.env.YOUTUBE_API_KEY
    }
  });

  return data.items.map(item => ({
    title: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    channel: item.snippet.channelTitle,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails?.default?.url,
    type: "video"
  }));
}


async function searchDuckDuckGo(query) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["image", "stylesheet", "font", "media"].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}+documentation+articles`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    // ✅ Wait for either selector (normal or HTML version)
    await page.waitForSelector("a.result__a, h2 a", { timeout: 15000 });

    const results = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a.result__a, h2 a"))
        .slice(0, 5)
        .map(a => ({
          title: a.textContent.trim(),
          url: a.href.startsWith("/l/?uddg=")
            ? decodeURIComponent(a.href.split("uddg=")[1])
            : a.href,
          type: "article"
        }))
    );
    return results;
  } finally {
    if (!page.isClosed()) await page.close();
  }
}


// Graceful shutdown
process.on("SIGINT", async () => {
  if (browser) await browser.close();
  process.exit();
});

/**
 * Combined Data
 */
async function generateData(topic) {
  const [duckDuckGoResults, youtubeResults] = await Promise.all([
    searchDuckDuckGo(topic),
    searchYouTube(topic),
  ]);

  return { topic, google: duckDuckGoResults, youtube: youtubeResults };
}


module.exports = { generateContentFromAI,  generateData };