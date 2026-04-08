import api from "./api";

export async function getPlaylists() {
  const { data } = await api.get("/playlists");
  return data;
}

export async function createPlaylist(name) {
  const { data } = await api.post("/playlists", { name });
  return data;
}

export async function renamePlaylist(playlistId, name) {
  const { data } = await api.put(`/playlists/${playlistId}`, { name });
  return data;
}

export async function deletePlaylist(playlistId) {
  const { data } = await api.delete(`/playlists/${playlistId}`);
  return data;
}

export async function addVideoToPlaylist(playlistId, payload) {
  const { data } = await api.post(`/playlists/${playlistId}/videos`, payload);
  return data;
}

export async function removeVideoFromPlaylist(playlistId, videoId) {
  const { data } = await api.delete(`/playlists/${playlistId}/videos/${videoId}`);
  return data;
}

export async function importYouTubePlaylist(playlistId, name) {
  const { data } = await api.post("/playlists/import", {
    playlistId,
    name,
  });
  return data;
}