const axios = require("axios");
const NodeCache = require("node-cache");

// Cache for 15 minutes to avoid rate limiting
const cache = new NodeCache({ stdTTL: 900 });

async function fetchLeetCodeStats(username) {
  if (!username) return null;
  const cacheKey = `lc_${username}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const { data } = await axios.get(`https://alfa-leetcode-api.onrender.com/${username}`);
    const result = {
      platform: "leetcode",
      username,
      totalSolved: data.totalSolved || 0,
      easySolved: data.easySolved || 0,
      mediumSolved: data.mediumSolved || 0,
      hardSolved: data.hardSolved || 0,
      ranking: data.ranking || "N/A"
    };
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("LeetCode fetch error:", error.message);
    return null;
  }
}

async function fetchCodeforcesStats(username) {
  if (!username) return null;
  const cacheKey = `cf_${username}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const { data } = await axios.get(`https://codeforces.com/api/user.info?handles=${username}`);
    if (data.status === "OK" && data.result.length > 0) {
      const info = data.result[0];
      const result = {
        platform: "codeforces",
        username,
        rating: info.rating || 0,
        maxRating: info.maxRating || 0,
        rank: info.rank || "unrated",
        // We can't trivially get "total solved" without fetching user.status, 
        // so we'll just track rating and contests.
      };
      cache.set(cacheKey, result);
      return result;
    }
    return null;
  } catch (error) {
    console.error("Codeforces fetch error:", error.message);
    return null;
  }
}

async function fetchCodeChefStats(username) {
  if (!username) return null;
  const cacheKey = `cc_${username}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const { data } = await axios.get(`https://codechef-api.vercel.app/${username}`);
    if (data.success) {
      const result = {
        platform: "codechef",
        username,
        rating: data.currentRating || 0,
        highestRating: data.highestRating || 0,
        stars: data.stars || "",
        globalRank: data.globalRank || "N/A"
      };
      cache.set(cacheKey, result);
      return result;
    }
    return null;
  } catch (error) {
    console.error("CodeChef fetch error:", error.message);
    return null;
  }
}

async function fetchContests() {
  const cacheKey = "upcoming_contests";
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    // Codeforces contests
    const { data } = await axios.get("https://codeforces.com/api/contest.list");
    let contests = [];
    if (data.status === "OK") {
      contests = data.result
        .filter(c => c.phase === "BEFORE")
        .map(c => ({
          id: c.id,
          name: c.name,
          platform: "Codeforces",
          startTimeSeconds: c.startTimeSeconds,
          durationSeconds: c.durationSeconds,
          link: `https://codeforces.com/contest/${c.id}`
        }));
    }
    
    // Attempt to fetch other contests via Kontests if available
    try {
      const lcRes = await axios.get("https://kontests.net/api/v1/leet_code");
      if (Array.isArray(lcRes.data)) {
        contests.push(...lcRes.data.map(c => ({
          id: c.name,
          name: c.name,
          platform: "LeetCode",
          startTimeSeconds: new Date(c.start_time).getTime() / 1000,
          durationSeconds: parseInt(c.duration, 10),
          link: c.url
        })));
      }
    } catch (e) {
      console.error("LeetCode contests fetch error:", e.message);
    }
    
    // Sort all contests by start time
    contests.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
    const result = contests.slice(0, 15); // limit to upcoming 15

    cache.set(cacheKey, result, 3600); // Cache contests for 1 hour
    return result;
  } catch (error) {
    console.error("Contests fetch error:", error.message);
    return [];
  }
}

module.exports = {
  fetchLeetCodeStats,
  fetchCodeforcesStats,
  fetchCodeChefStats,
  fetchContests
};
