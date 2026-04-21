import api from "./api";

export async function completeTask() {
  const { data } = await api.post("/activity/complete-task");
  return data;
}

export async function getStreak() {
  const { data } = await api.get("/activity/streak");
  return data;
}
