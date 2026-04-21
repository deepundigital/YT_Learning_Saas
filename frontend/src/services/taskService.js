import api from "./api";

export async function getTasks(date) {
  const params = date ? { date } : {};
  const { data } = await api.get("/tasks", { params });
  return data;
}

export async function createTask(payload) {
  const { data } = await api.post("/tasks", payload);
  return data;
}

export async function markTaskComplete(id) {
  const { data } = await api.patch(`/tasks/${id}/complete`);
  return data;
}

export async function deleteTask(id) {
  const { data } = await api.delete(`/tasks/${id}`);
  return data;
}
