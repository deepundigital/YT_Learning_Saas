import api from "./api";

export async function getNotesByVideo(youtubeId) {
  const { data } = await api.get(`/notes/video/${youtubeId}`);
  return data;
}

export async function createNote(payload) {
  const { data } = await api.post("/notes", payload);
  return data;
}

export async function updateNote(noteId, payload) {
  const { data } = await api.put(`/notes/${noteId}`, payload);
  return data;
}

export async function deleteNote(noteId) {
  const { data } = await api.delete(`/notes/${noteId}`);
  return data;
}