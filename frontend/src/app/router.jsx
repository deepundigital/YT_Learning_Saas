import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AppLayout from "../layouts/AppLayout";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import VideoLearningPage from "../pages/VideoLearningPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import SettingsPage from "../pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      { path: "video/:videoId", element: <VideoLearningPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);