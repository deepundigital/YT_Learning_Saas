import api from "./api";

export async function getVideoMeta(videoId) {
  const { data } = await api.get(`/videos/meta/${videoId}`);
  return data;
}

export async function searchVideos(query, type = "playlist") {
  const { data } = await api.get(`/videos/search`, {
    params: { q: query, type }
  });
  return data;
}

export async function getPlaylistVideos(playlistId) {
  const { data } = await api.get(`/videos/playlist/${playlistId}`);
  return data;
}