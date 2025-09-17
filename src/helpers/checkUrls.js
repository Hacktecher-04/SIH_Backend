// helpers/checkUrls.js
const fetch = require("node-fetch");

async function checkYouTubeVideo(url) {
  try {
    const idMatch = url.match(/v=([A-Za-z0-9_\-]{11})/);
    if (!idMatch) return false;
    const videoId = idMatch[1];
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const resp = await fetch(oEmbedUrl, { timeout: 8000 });
    return resp.ok;
  } catch {
    return false;
  }
}

async function filterWorkingUrls(resources = []) {
  const checked = await Promise.all(
    resources.map(async (res) => {
      try {
        if (res.url.includes("youtube.com/watch")) {
          if (await checkYouTubeVideo(res.url)) return res;
          return null;
        } else {
          const r = await fetch(res.url, { method: "HEAD", timeout: 8000 });
          if (r.ok) return res;
        }
      } catch {}
      return null;
    })
  );
  return checked.filter(Boolean);
}

module.exports = filterWorkingUrls;
