// googleSearch.js
const filterWorkingUrls = require("../helpers/checkUrls");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;

async function searchAndFilter(query) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(
    query
  )}`;
  const resp = await fetch(url); // built-in fetch in Node 18+
  if (!resp.ok) throw new Error("Google API error");
  const json = await resp.json();

  const resources = (json.items || []).map((item) => ({
    name: item.title,
    url: item.link,
    type: "link",
  }));

  return await filterWorkingUrls(resources);
}

module.exports = searchAndFilter;