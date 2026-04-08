import api from "./api";

export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);

  if (data?.token) localStorage.setItem("token", data.token);
  if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}

export async function loginUser(payload) {
  const { data } = await api.post("/auth/login", payload);

  if (data?.token) localStorage.setItem("token", data.token);
  if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await api.post(`/auth/reset-password/${token}`, { password });
  return data;
}

export async function googleLoginUser(credential) {
  const { data } = await api.post("/auth/google", { credential });

  if (data?.token) localStorage.setItem("token", data.token);
  if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}