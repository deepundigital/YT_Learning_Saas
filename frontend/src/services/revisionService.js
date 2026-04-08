import api from "./api";

export async function saveRevisionReview(payload) {
  const { data } = await api.post("/revision/review", payload);
  return data;
}

export async function createRevisionFromNotes(youtubeId) {
  const { data } = await api.post(`/revision/from-notes/${youtubeId}`);
  return data;
}

export async function createRevisionFromBookmarks(youtubeId) {
  const { data } = await api.post(`/revision/from-bookmarks/${youtubeId}`);
  return data;
}

export async function getTodayRevisionItems() {
  const { data } = await api.get("/revision/today");
  return data;
}

export async function getRevisionItemsByVideo(youtubeId) {
  const { data } = await api.get(`/revision/video/${youtubeId}`);
  return data;
}