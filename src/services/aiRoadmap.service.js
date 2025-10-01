const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { GoogleGenAI } = require("@google/genai");
const axios = require("axios");
const masterPrompts = require("../prompts/roadmap.prompt"); // adjust path

puppeteer.use(StealthPlugin());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

let browser;

// Deployment-safe browser getter
async function getBrowser() {
  if (browser && browser.isConnected()) return browser;

  if (process.env.BROWSERLESS_WS_URL) {
    // Use remote Browserless for Render
    browser = await puppeteer.connect({
      browserWSEndpoint: process.env.BROWSERLESS_WS_URL,
    });
  } else {
    // Local development
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browser;
}

/* ================== Gemini AI ================== */
async function generateContentFromAI(goal, level, pace) {
  const prompt = masterPrompts(goal, level, pace);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : null;

    if (!jsonString) throw new Error("No JSON found in Gemini output");
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("Failed to parse Gemini output:", err);
    return { success: false, message: "AI returned invalid output" };
  }
}

/* ================== YouTube Search ================== */
async function searchYouTube(query) {
  try {
    const { data } = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        q: query,
        maxResults: 5,
        type: "video",
        key: process.env.YOUTUBE_API_KEY,
      },
    });

    return data.items.map(item => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      channel: item.snippet.channelTitle,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.default?.url,
      type: "video",
    }));
  } catch (err) {
    console.error("YouTube search failed:", err);
    return [];
  }
}

/* ================== DuckDuckGo Search ================== */
async function searchDuckDuckGo(query) {
  // Skip if running on Render without remote browser
  if (process.env.RENDER && !process.env.BROWSERLESS_WS_URL) {
    console.warn("Skipping DuckDuckGo search: Chrome not available on Render");
    return [];
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setRequestInterception(true);
    page.on("request", req => {
      if (["image", "stylesheet", "font", "media"].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}+documentation+articles`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("a.result__a, h2 a", { timeout: 15000 });

    const results = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a.result__a, h2 a"))
        .slice(0, 5)
        .map(a => ({
          title: a.textContent.trim(),
          url: a.href.startsWith("/l/?uddg=")
            ? decodeURIComponent(a.href.split("uddg=")[1])
            : a.href,
          type: "article",
        }))
    );

    return results;
  } catch (err) {
    console.error("DuckDuckGo search failed:", err);
    return [];
  } finally {
    if (!page.isClosed()) await page.close();
  }
}

/* ================== Combined Data Generator ================== */
async function generateData(topic) {
  const [duckResults, youtubeResults] = await Promise.all([
    searchDuckDuckGo(topic),
    searchYouTube(topic),
  ]);

  return { topic, google: duckResults, youtube: youtubeResults };
}

/* ================== Graceful Shutdown ================== */
process.on("SIGINT", async () => {
  if (browser) await browser.close();
  process.exit();
});

module.exports = { generateContentFromAI, generateData };