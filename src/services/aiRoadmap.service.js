const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const chromium = require("@sparticuz/chromium");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const masterPrompts = require("../prompts/roadmap.prompt"); // adjust path

puppeteer.use(StealthPlugin());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// The global instance to hold our single, persistent browser
let browserInstance = null;

/* ================== OPTIMIZED "WARM" BROWSER GETTER ================== */
async function getBrowser() {
    // If the instance already exists and is connected, reuse it
    if (browserInstance && browserInstance.isConnected()) {
        console.log("Reusing existing browser instance.");
        return browserInstance;
    }

    console.log("No active browser instance found. Launching a new one...");
    const isProduction = process.env.RENDER === 'true';
    try {
        let browserOptions;
        if (isProduction) {
            console.log("Launching production browser on Render...");
            browserOptions = {
                args: [...chromium.args, '--disable-dev-shm-usage', '--no-zygote', '--single-process'],
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
        // Assign the new browser to our global instance
        browserInstance = await puppeteer.launch(browserOptions);
        console.log("✅ New browser instance launched successfully.");
        return browserInstance;
    } catch (err) {
        console.error("❌ Failed to launch browser:", err.message);
        throw err;
    }
}

/* ================== Gemini AI ================== */
async function generateContentFromAI(goal, level, pace) {
    const prompt = masterPrompts(goal, level, pace);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;

        if (response.promptFeedback?.blockReason) {
            throw new Error(`AI response was blocked. Reason: ${response.promptFeedback.blockReason}`);
        }

        const text = response.text().trim();
        const jsonMatch = text.match(/```json\s*(\{[\s\S]*\})\s*```|(\{[\s\S]*\})/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[2]) : null;

        if (!jsonString) {
            throw new Error("No valid JSON block found in the AI's output.");
        }
        return JSON.parse(jsonString);
    } catch (err) {
        console.error("❌ Failed in generateContentFromAI:", err.message);
        return { success: false, message: `AI Error: ${err.message}` };
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
        console.error("YouTube search failed:", err.response?.data || err.message);
        return [];
    }
}

/* ================== DuckDuckGo Search ================== */
async function searchDuckDuckGo(query) {
    // Get the single, shared browser instance
    const browser = await getBrowser();
    // Create a new page for this specific task
    const page = await browser.newPage();
    try {
        await page.setRequestInterception(true);
        page.on("request", (req) => {
            if (["image", "stylesheet", "font", "media"].includes(req.resourceType()))
                req.abort();
            else req.continue();
        });
        const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}+documentation+articles`;
        await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForSelector("h2 a", { timeout: 15000 });
        const results = await page.evaluate(() =>
            Array.from(document.querySelectorAll("h2 a"))
                .slice(0, 5)
                .map((a) => ({ title: a.textContent.trim(), url: a.href, type: "article" }))
        );
        return results;
    } catch (err) {
        console.error("❌ DuckDuckGo search failed:", err.message);
        return [];
    } finally {
        // IMPORTANT: We only close the PAGE now, not the whole browser
        if (page && !page.isClosed()) {
            await page.close();
        }
    }
}

/* ================== Combined Data Generator ================== */
async function generateData(topic) {
    try {
        const [duckResults, youtubeResults] = await Promise.all([
            searchDuckDuckGo(topic),
            searchYouTube(topic),
        ]);

        // CORRECTED: The property name is 'articles' to match the searchDuckDuckGo output
        const finalData = { topic, google: duckResults, videos: youtubeResults };

        if (!finalData) {
            throw new Error("data not created");
        }
        // CORRECTED: The property name is 'articles'
        if (!finalData.google || !finalData.videos) {
            throw new Error("data not created");
        }
        return finalData;
    } catch (err) {
        console.error("❌ Failed during data generation:", err.message);
        return { success: false, message: `Failed during data generation: ${err.message}` };
    }
}

/* ================== Graceful Shutdown ================== */
async function closeBrowser() {
    // This function now closes the single, shared instance
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
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