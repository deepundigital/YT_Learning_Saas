import axios from "axios";

const PYTHON_API_URL = "http://localhost:8000";

const downloadApi = axios.create({
  baseURL: PYTHON_API_URL,
  withCredentials: true // Important for sessions and cookies
});

export async function getDownloadLink(youtubeUrl) {
  try {
    const { data } = await downloadApi.post("/api/download", { url: youtubeUrl });
    
    if (data.ok) {
      // Store in local storage as requested
      const history = JSON.parse(localStorage.getItem("download_history") || "[]");
      const newItem = {
        url: youtubeUrl,
        title: data.title,
        thumbnail: data.thumbnail,
        timestamp: new Date().toISOString()
      };
      
      // Avoid duplicates
      const filtered = history.filter(item => item.url !== youtubeUrl);
      localStorage.setItem("download_history", JSON.stringify([newItem, ...filtered].slice(0, 20)));
    }
    
    return data;
  } catch (error) {
    console.error("Download Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to get download link");
  }
}

export async function getDownloadStats() {
  try {
    const { data } = await downloadApi.get("/api/stats");
    return data;
  } catch (error) {
    console.error("Stats Error:", error);
    return null;
  }
}

export function getLocalDownloadHistory() {
  return JSON.parse(localStorage.getItem("download_history") || "[]");
}
