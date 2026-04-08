import api from "./api";

export async function updateVideoProgress(payload) {
  const { data } = await api.post("/progress/update", payload);
  return data;
}

export async function getAllProgress() {
  const { data } = await api.get("/progress");
  return data;
}

export async function getProgressSummary() {
  const { data } = await api.get("/progress/analytics/summary");
  return data;
}