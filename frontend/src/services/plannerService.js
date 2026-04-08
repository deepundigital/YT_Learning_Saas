import api from "./api";

export async function getStudyGoals() {
  const { data } = await api.get("/planner");
  return data;
}

export async function getStudyGoal(goalId) {
  const { data } = await api.get(`/planner/${goalId}`);
  return data;
}

export async function createStudyGoal(payload) {
  const { data } = await api.post("/planner", payload);
  return data;
}

export async function updateStudyGoal(goalId, payload) {
  const { data } = await api.put(`/planner/${goalId}`, payload);
  return data;
}

export async function deleteStudyGoal(goalId) {
  const { data } = await api.delete(`/planner/${goalId}`);
  return data;
}