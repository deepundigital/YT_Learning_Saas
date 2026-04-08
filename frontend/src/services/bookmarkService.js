import api from "./api";

export async function getBookmarksByVideo(youtubeId) {
  const { data } = await api.get(`/bookmarks/video/${youtubeId}`);
  return data;
}

export async function createBookmark(payload) {
  const { data } = await api.post("/bookmarks", payload);
  return data;
}

export async function deleteBookmark(bookmarkId) {
  const { data } = await api.delete(`/bookmarks/${bookmarkId}`);
  return data;
}