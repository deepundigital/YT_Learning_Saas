const axios = require("axios");
const NodeCache = require("node-cache");
const cheerio = require("cheerio");

// Cache for 1 hour to avoid rate limiting
const cache = new NodeCache({ stdTTL: 3600 });

async function fetchLeetCodeStats(username) {
  if (!username) return null;
  const cacheKey = `lc_${username}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
        recentAcSubmissionList(username: $username, limit: 15) {
          title
          timestamp
        }
      }
    `;

    const { data } = await axios.post("https://leetcode.com/graphql", {
      query,
      variables: { username }
    }, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    if (data.errors || !data.data.matchedUser) return null;

    const stats = data.data.matchedUser.submitStats.acSubmissionNum;
    const all = stats.find(s => s.difficulty === "All")?.count || 0;
    const easy = stats.find(s => s.difficulty === "Easy")?.count || 0;
    const medium = stats.find(s => s.difficulty === "Medium")?.count || 0;
    const hard = stats.find(s => s.difficulty === "Hard")?.count || 0;

    const recentSubmissions = data.data.recentAcSubmissionList || [];
    
    // Check if solved today
    let solvedToday = false;
    const todayStr = new Date().toISOString().split("T")[0];
    for (const sub of recentSubmissions) {
      const subDateStr = new Date(sub.timestamp * 1000).toISOString().split("T")[0];
      if (subDateStr === todayStr) {
        solvedToday = true;
        break;
      }
    }

    const result = {
      platform: "leetcode",
      username,
      totalSolved: all,
      easySolved: easy,
      mediumSolved: medium,
      hardSolved: hard,
      solvedToday
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("LeetCode GraphQL fetch error:", error.message);
    return null;
  }
}

async function fetchCodeforcesStats(username) {
  if (!username) return null;
  const cacheKey = `cf_${username}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const [userInfoRes, userStatusRes] = await Promise.all([
      axios.get(`https://codeforces.com/api/user.info?handles=${username}`),
      axios.get(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=20`)
    ]);

    let solvedToday = false;
    const todayStr = new Date().toISOString().split("T")[0];
    
    if (userStatusRes.data.status === "OK") {
      const recentAc = userStatusRes.data.result.filter(s => s.verdict === "OK");
      for (const sub of recentAc) {
        const subDateStr = new Date(sub.creationTimeSeconds * 1000).toISOString().split("T")[0];
        if (subDateStr === todayStr) {
          solvedToday = true;
          break;
        }
      }
    }

    if (userInfoRes.data.status === "OK" && userInfoRes.data.result.length > 0) {
      const info = userInfoRes.data.result[0];
      const result = {
        platform: "codeforces",
        username,
        rating: info.rating || 0,
        maxRating: info.maxRating || 0,
        rank: info.rank || "unrated",
        solvedToday
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
    const { data } = await axios.get(`https://www.codechef.com/users/${username}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const $ = cheerio.load(data);
    
    const ratingStr = $(".rating-number").text().trim();
    const currentRating = parseInt(ratingStr, 10) || 0;
    
    const highestRatingStr = $(".rating-header .rating-star").parent().text();
    const maxMatch = highestRatingStr.match(/Highest Rating\s*(\d+)/);
    const highestRating = maxMatch ? parseInt(maxMatch[1], 10) : 0;
    
    const stars = $(".rating-star").first().text().trim() || "1★";

    // Try to get total solved
    const solvedStr = $("h3:contains('Fully Solved')").text();
    const solvedMatch = solvedStr.match(/Fully Solved\s*\((\d+)\)/);
    const totalSolved = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;

    const result = {
      platform: "codechef",
      username,
      rating: currentRating,
      highestRating,
      stars,
      totalSolved
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("CodeChef cheerio fetch error:", error.message);
    return null;
  }
}

async function fetchGfgStats(username) {
  if (!username) return null;
  const cacheKey = `gfg_${username}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const { data } = await axios.get(`https://www.geeksforgeeks.org/user/${username}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    const $ = cheerio.load(data);
    
    // GFG structure often changes, this is a common selector for total problems solved
    const solvedStr = $(".scoreCard_head_left--score").first().text() || "0";
    const totalSolved = parseInt(solvedStr, 10) || 0;

    const result = {
      platform: "gfg",
      username,
      totalSolved,
      rank: $(".rankNum").text().trim() || "N/A"
    };
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("GFG fetch error:", error.message);
    return null;
  }
}

async function fetchCodingNinjasStats(username) {
  if (!username) return null;
  const cacheKey = `cn_${username}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    // Coding Ninjas usually requires more complex scraping or has a hidden API
    // Returning a basic structure for now
    const result = {
      platform: "codingninjas",
      username,
      totalSolved: 0, 
      rank: "N/A"
    };
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    return null;
  }
}

async function fetchContests() {
  const cacheKey = "upcoming_contests";
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
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
    } catch (e) {}
    
    contests.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
    const result = contests.slice(0, 15);

    cache.set(cacheKey, result, 3600);
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
  fetchGfgStats,
  fetchCodingNinjasStats,
  fetchContests
};
