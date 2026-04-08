import api from "./api";

export async function getDashboardAnalytics() {
  const { data } = await api.get("/analytics/dashboard");
  return data;
}

export async function getVideoAnalytics(youtubeId) {
  const { data } = await api.get(`/analytics/video/${youtubeId}`);
  return data;
}