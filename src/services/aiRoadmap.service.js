const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const chromium = require("@sparticuz/chromium");
const { GoogleGenAI } = require("@google/genai");
const axios = require("axios");
const masterPrompts = require("../prompts/roadmap.prompt"); // adjust path

puppeteer.use(StealthPlugin());

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

let browser;

/* ================== UNIFIED BROWSER GETTER (WORKS LOCALLY & ON RENDER) ================== */
async function getBrowser() {
    if (browser && browser.isConnected()) {
        return browser;
    }
    const isProduction = process.env.RENDER === 'true';
    try {
        let browserOptions;
        if (isProduction) {
            console.log("Launching production browser on Render...");
            browserOptions = {
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            };
        } else {
            console.log("Launching local development browser...");
            browserOptions = {
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            };
        }
        browser = await puppeteer.launch(browserOptions);
        return browser;
    } catch (err) {
        console.error("❌ Failed to launch browser:", err.message);
        throw err;
    }
}

/* ================== Gemini AI ================== */
async function generateContentFromAI(goal, level, pace) {
    const prompt = masterPrompts(goal, level, pace);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : null;
        if (!jsonString) throw new Error("No JSON found in Gemini output");
        return JSON.parse(jsonString);
    } catch (err) {
        console.error("❌ Failed to parse Gemini output:", err.message);
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

        // =================================================================
        //  FIX IS HERE: Add a safety check before using .map()
        // =================================================================
        if (!data || !Array.isArray(data.items)) {
            console.warn("⚠️ YouTube API did not return an array of items. This could be due to an invalid API key or quota issues.");
            return []; // Return an empty array to prevent a crash
        }

        return data.items.map((item) => ({
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            channel: item.snippet.channelTitle,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails?.default?.url,
            type: "video",
        }));
    } catch (err) {
        console.error("❌ YouTube search failed:", err.response?.status, err.response?.data || err.message);
        return []; // Return an empty array on error
    }
}

/* ================== DuckDuckGo Search ================== */
async function searchDuckDuckGo(query) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
        await page.setRequestInterception(true);
        page.on("request", (req) => {
            if (["image", "stylesheet", "font", "media"].includes(req.resourceType()))
                req.abort();
            else req.continue();
        });
        const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}+documentation+articles`;
        await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForSelector("h2 a", { timeout: 15000 });
        const results = await page.evaluate(() =>
            Array.from(document.querySelectorAll("h2 a"))
                .slice(0, 5)
                .map((a) => ({
                    title: a.textContent.trim(),
                    url: a.href,
                    type: "article",
                }))
        );
        return results;
    } catch (err) {
        console.error("❌ DuckDuckGo search failed:", err.message);
        return [];
    } finally {
        if (!page.isClosed()) await page.close();
    }
}

/* ================== Combined Data Generator ================== */
async function generateData(topic) {
    try {
        const [duckResults, youtubeResults] = await Promise.all([
            searchDuckDuckGo(topic),
            searchYouTube(topic),
        ]);
        const finalData = { topic, articles: duckResults, videos: youtubeResults };
        return finalData; // Return the data whether it was saved or not
    } catch (err) {
        // This will catch any unexpected errors from the Promise.all or the subsequent code
        console.error("❌ Failed during data generation or saving:", err.message);
        return { success: false, message: `Failed during data generation or saving: ${err.message}` };
    }
}

/* ================== Graceful Shutdown ================== */
async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
        console.log("Browser closed gracefully.");
    }
}

process.on("SIGINT", async () => {
    await closeBrowser();
    process.exit();
});
process.on("SIGTERM", async () => {
    await closeBrowser();
    process.exit();
});

module.exports = { generateContentFromAI, generateData, closeBrowser };