import api from "./api";

export async function getVideoMeta(videoId) {
  const { data } = await api.get(`/videos/meta/${videoId}`);
  return data;
}