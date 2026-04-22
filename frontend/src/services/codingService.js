import api from "./api";

export async function updateCodingProfiles(profiles) {
  const { data } = await api.post("/coding/tracker/update", profiles);
  return data;
}

export async function getCodingDashboardStats(userId = "me") {
  const { data } = await api.get(`/coding/tracker/${userId}`);
  return data;
}

export async function getTodayActivity() {
  const { data } = await api.get("/coding/activity/today");
  return data;
}

export async function getSocialLeaderboard() {
  const { data } = await api.get("/coding/leaderboard");
  return data;
}

export async function getUpcomingContests() {
  const { data } = await api.get("/coding/contests");
  return data;
}

export async function markProblemSolved(platform) {
  const { data } = await api.post("/coding/solve", { platform });
  return data;
}
