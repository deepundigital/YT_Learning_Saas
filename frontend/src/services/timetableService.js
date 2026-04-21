import api from "./api";

export async function getTimetable() {
  const { data } = await api.get("/timetable");
  return data;
}

export async function createTimetableEntry(payload) {
  const { data } = await api.post("/timetable", payload);
  return data;
}

export async function deleteTimetableEntry(id) {
  const { data } = await api.delete(`/timetable/${id}`);
  return data;
}
