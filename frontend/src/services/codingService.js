import axios from "axios";
import api from "./api";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export async function updateCodingProfiles(profiles) {
  console.log("Sending token:", localStorage.getItem("token"));
  const { data } = await axios.post(
    `${BACKEND_URL}/api/coding/tracker/update`,
    profiles,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      withCredentials: true
    }
  );
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
