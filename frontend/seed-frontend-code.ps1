$ErrorActionPreference = "Stop"

function Write-Utf8File {
    param(
        [string]$Path,
        [string]$Content
    )

    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    [System.IO.File]::WriteAllText((Resolve-Path ".").Path + "\" + $Path, $Content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Wrote: $Path" -ForegroundColor Green
}

Write-Utf8File "tailwind.config.js" @'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 40px rgba(59,130,246,0.25)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
'@

Write-Utf8File "postcss.config.js" @'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
'@

Write-Utf8File "src/main.jsx" @'
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
'@

Write-Utf8File "src/App.jsx" @'
export default function App() {
  return null;
}
'@

Write-Utf8File "src/index.css" @'
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

:root {
  --bg: #020617;
  --panel: rgba(255, 255, 255, 0.06);
  --panel-border: rgba(255, 255, 255, 0.1);
  --text: #e2e8f0;
  --muted: #94a3b8;
  --brand: #3b82f6;
  --brand-2: #8b5cf6;
}

.light {
  --bg: #f8fafc;
  --panel: rgba(255, 255, 255, 0.85);
  --panel-border: rgba(15, 23, 42, 0.08);
  --text: #0f172a;
  --muted: #475569;
  --brand: #2563eb;
  --brand-2: #7c3aed;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 30%),
    radial-gradient(circle at top right, rgba(139, 92, 246, 0.16), transparent 30%),
    var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, sans-serif;
}

#root {
  min-height: 100vh;
}

.glass {
  background: var(--panel);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(16px);
}

.section-container {
  @apply mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8;
}

.text-muted {
  color: var(--muted);
}

.gradient-text {
  background: linear-gradient(90deg, var(--brand), var(--brand-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.grid-bg {
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 28px 28px;
}
'@

Write-Utf8File "src/app/constants.js" @'
export const APP_NAME = "Interactive Lea";

export const AI_TABS = [
  "Summary",
  "Flashcards",
  "Quiz",
  "Ask AI",
  "Chat",
];
'@

Write-Utf8File "src/app/router.jsx" @'
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
'@

Write-Utf8File "src/context/ThemeContext.jsx" @'
import { createContext, useEffect, useMemo, useState } from "react";

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
      setTheme,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
'@

Write-Utf8File "src/hooks/useTheme.js" @'
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export default function useTheme() {
  return useContext(ThemeContext);
}
'@

Write-Utf8File "src/services/api.js" @'
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
'@

Write-Utf8File "src/services/authService.js" @'
import api from "./api";

export async function loginUser(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}
'@

Write-Utf8File "src/services/videoService.js" @'
import api from "./api";

export async function getVideoMeta(videoId) {
  const { data } = await api.get(`/videos/meta/${videoId}`);
  return data;
}

export async function importTranscript(videoId, payload) {
  const { data } = await api.post(`/transcripts/${videoId}/import`, payload);
  return data;
}

export async function getTranscript(videoId, forceRefresh = false) {
  const { data } = await api.get(
    `/transcripts/${videoId}${forceRefresh ? "?forceRefresh=true" : ""}`
  );
  return data;
}
'@

Write-Utf8File "src/services/aiService.js" @'
import api from "./api";

export async function generateSummary(videoId, forceRefresh = false) {
  const { data } = await api.post(
    `/ai/summary/${videoId}${forceRefresh ? "?forceRefresh=true" : ""}`
  );
  return data;
}

export async function generateFlashcards(videoId, count = 8, forceRefresh = false) {
  const { data } = await api.post(
    `/ai/flashcards/${videoId}${forceRefresh ? "?forceRefresh=true" : ""}`,
    { count }
  );
  return data;
}

export async function generateQuiz(videoId, count = 5, forceRefresh = false) {
  const { data } = await api.post(
    `/ai/quiz/${videoId}${forceRefresh ? "?forceRefresh=true" : ""}`,
    { count }
  );
  return data;
}

export async function askAi(videoId, question) {
  const { data } = await api.post(`/ai/ask/${videoId}`, { question });
  return data;
}

export async function chatWithAi(videoId, question) {
  const { data } = await api.post(`/ai/chat/${videoId}`, { question });
  return data;
}
'@

Write-Utf8File "src/utils/helpers.js" @'
export function extractYoutubeId(url = "") {
  const trimmed = String(url).trim();

  const match =
    trimmed.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/) ||
    trimmed.match(/^([a-zA-Z0-9_-]{11})$/);

  return match?.[1] || "";
}
'@

Write-Utf8File "src/components/common/Button.jsx" @'
export default function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-300";

  const styles = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.35)]",
    secondary:
      "glass text-[var(--text)] hover:scale-[1.02] hover:border-white/20",
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
'@

Write-Utf8File "src/components/common/Card.jsx" @'
export default function Card({ children, className = "" }) {
  return <div className={`glass rounded-3xl p-5 shadow-2xl ${className}`}>{children}</div>;
}
'@

Write-Utf8File "src/components/common/SectionHeading.jsx" @'
export default function SectionHeading({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold md:text-4xl">{title}</h2>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-sm md:text-base text-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}
'@

Write-Utf8File "src/components/common/ThemeToggle.jsx" @'
import { Moon, Sun } from "lucide-react";
import useTheme from "../../hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="glass rounded-2xl p-3 transition hover:scale-105"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
'@

Write-Utf8File "src/components/layout/Navbar.jsx" @'
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { APP_NAME } from "../../app/constants";
import ThemeToggle from "../common/ThemeToggle";
import Button from "../common/Button";

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl"
    >
      <div className="section-container flex items-center justify-between py-4">
        <Link to="/" className="text-xl font-bold">
          <span className="gradient-text">{APP_NAME}</span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="secondary">Login</Button>
          </Link>
          <Link to="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
'@

Write-Utf8File "src/components/layout/Sidebar.jsx" @'
import { Link, useLocation } from "react-router-dom";
import { BarChart3, Home, Settings, Video } from "lucide-react";

const links = [
  { label: "Dashboard", path: "/dashboard", icon: Home },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="glass hidden w-72 shrink-0 border-r border-white/10 p-5 lg:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-500/20 p-3">
          <Video size={20} />
        </div>
        <div>
          <p className="font-semibold">Interactive Lea</p>
          <p className="text-sm text-muted">AI Learning Suite</p>
        </div>
      </div>

      <nav className="space-y-2">
        {links.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                active ? "bg-blue-600 text-white" : "hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
'@

Write-Utf8File "src/components/landing/FloatingOrbs.jsx" @'
import { motion } from "framer-motion";

export default function FloatingOrbs() {
  return (
    <>
      <motion.div
        animate={{ y: [0, -25, 0], x: [0, 15, 0] }}
        transition={{ repeat: Infinity, duration: 7 }}
        className="absolute left-10 top-20 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 9 }}
        className="absolute right-10 top-28 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl"
      />
    </>
  );
}
'@

Write-Utf8File "src/components/landing/HeroSection.jsx" @'
import { motion } from "framer-motion";
import { BrainCircuit, Sparkles, Video } from "lucide-react";
import Button from "../common/Button";
import Card from "../common/Card";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="section-container grid items-center gap-10 lg:grid-cols-2">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300"
          >
            AI Powered Interactive Learning Platform
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold leading-tight md:text-6xl"
          >
            Learn from YouTube videos with{" "}
            <span className="gradient-text">AI, quizzes, notes, and chat</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-2xl text-base text-muted md:text-lg"
          >
            A modern learning software inspired by Replit, Udemy, and startup-grade
            animated products. Import videos, generate summaries, flashcards,
            quizzes, and chat with the content.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Button>Start Learning</Button>
            <Button variant="secondary">Explore Demo</Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="grid gap-4"
        >
          <Card className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-blue-500/10 p-4">
              <Sparkles className="mb-3 text-blue-300" />
              <h3 className="font-semibold">AI Summary</h3>
              <p className="mt-2 text-sm text-muted">
                Generate transcript-aware summaries instantly.
              </p>
            </div>

            <div className="rounded-2xl bg-violet-500/10 p-4">
              <BrainCircuit className="mb-3 text-violet-300" />
              <h3 className="font-semibold">Smart Flashcards</h3>
              <p className="mt-2 text-sm text-muted">
                Build revision-ready flashcards and quizzes.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-500/10 p-4 md:col-span-2">
              <Video className="mb-3 text-emerald-300" />
              <h3 className="font-semibold">Interactive Video Learning</h3>
              <p className="mt-2 text-sm text-muted">
                Notes, transcript import, AI Q&A, analytics, and themed experience.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
'@

Write-Utf8File "src/components/landing/FeatureGrid.jsx" @'
import { motion } from "framer-motion";
import { BarChart3, Bot, FileText, MessageSquare, MoonStar, Timer } from "lucide-react";
import Card from "../common/Card";
import SectionHeading from "../common/SectionHeading";

const features = [
  { title: "AI Summary", icon: FileText, desc: "Understand videos quickly with structured summaries." },
  { title: "AI Chat", icon: MessageSquare, desc: "Ask doubts and chat with your video content." },
  { title: "Flashcards", icon: Bot, desc: "Turn concepts into revision-ready study cards." },
  { title: "Analytics", icon: BarChart3, desc: "Track study time, quiz performance, and AI usage." },
  { title: "Themes", icon: MoonStar, desc: "Dark mode, light mode, and customizable UI feel." },
  { title: "Interactive Learning", icon: Timer, desc: "Study through notes, quiz, flashcards, and chat." },
];

export default function FeatureGrid() {
  return (
    <section className="section-container py-16">
      <SectionHeading
        title="Everything your learning software needs"
        subtitle="Built for AI-first learning, easy interaction, and future product scaling."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
            >
              <Card className="h-full transition hover:-translate-y-1">
                <Icon className="mb-4 text-blue-300" />
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm text-muted">{feature.desc}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
'@

Write-Utf8File "src/components/video/VideoInfoCard.jsx" @'
import Card from "../common/Card";

export default function VideoInfoCard() {
  return (
    <Card>
      <h3 className="text-lg font-semibold">Video Information</h3>
      <p className="mt-3 text-sm text-muted">
        Metadata, transcript status, and actions will appear here.
      </p>
    </Card>
  );
}
'@

Write-Utf8File "src/components/video/AiTabs.jsx" @'
import { useState } from "react";
import { AI_TABS } from "../../app/constants";
import Card from "../common/Card";

export default function AiTabs() {
  const [activeTab, setActiveTab] = useState("Summary");

  return (
    <Card>
      <div className="mb-4 flex flex-wrap gap-2">
        {AI_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-2xl px-4 py-2 text-sm transition ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-[var(--text)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 p-5">
        <h3 className="font-semibold">{activeTab}</h3>
        <p className="mt-2 text-sm text-muted">
          {activeTab} panel UI and backend integration yahin add hogi.
        </p>
      </div>
    </Card>
  );
}
'@

Write-Utf8File "src/components/video/TranscriptPanel.jsx" @'
import Card from "../common/Card";
import Button from "../common/Button";

export default function TranscriptPanel() {
  return (
    <Card>
      <h3 className="text-lg font-semibold">Transcript</h3>
      <p className="mt-2 text-sm text-muted">
        Auto fetch failed? Paste transcript manually and improve AI results.
      </p>

      <textarea
        className="mt-4 min-h-[160px] w-full rounded-2xl border border-white/10 bg-transparent p-4 outline-none"
        placeholder="Paste transcript here..."
      />

      <div className="mt-4 flex gap-3">
        <Button>Import Transcript</Button>
        <Button variant="secondary">Auto Fetch</Button>
      </div>
    </Card>
  );
}
'@

Write-Utf8File "src/layouts/MainLayout.jsx" @'
import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";

export default function MainLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Outlet />
    </div>
  );
}
'@

Write-Utf8File "src/layouts/AppLayout.jsx" @'
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
'@

Write-Utf8File "src/pages/LandingPage.jsx" @'
import FloatingOrbs from "../components/landing/FloatingOrbs";
import HeroSection from "../components/landing/HeroSection";
import FeatureGrid from "../components/landing/FeatureGrid";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <FloatingOrbs />
      <div className="grid-bg">
        <HeroSection />
        <FeatureGrid />
      </div>
    </div>
  );
}
'@

Write-Utf8File "src/pages/LoginPage.jsx" @'
export default function LoginPage() {
  return (
    <div className="section-container flex min-h-[80vh] items-center justify-center">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="mt-2 text-muted">Connect this page with backend auth next.</p>
      </div>
    </div>
  );
}
'@

Write-Utf8File "src/pages/RegisterPage.jsx" @'
export default function RegisterPage() {
  return (
    <div className="section-container flex min-h-[80vh] items-center justify-center">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <h1 className="text-3xl font-bold">Register</h1>
        <p className="mt-2 text-muted">Create account UI will come next.</p>
      </div>
    </div>
  );
}
'@

Write-Utf8File "src/pages/DashboardPage.jsx" @'
import Card from "../components/common/Card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted">
          Continue learning, manage videos, and track AI activity.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {["Videos", "AI Chats", "Flashcards", "Quizzes"].map((item) => (
          <Card key={item}>
            <h3 className="font-semibold">{item}</h3>
            <p className="mt-2 text-sm text-muted">Analytics card placeholder</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
'@

Write-Utf8File "src/pages/VideoLearningPage.jsx" @'
import VideoInfoCard from "../components/video/VideoInfoCard";
import AiTabs from "../components/video/AiTabs";
import TranscriptPanel from "../components/video/TranscriptPanel";

export default function VideoLearningPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_1.2fr_0.9fr]">
      <div className="space-y-6">
        <div className="glass flex aspect-video items-center justify-center rounded-3xl">
          <p className="text-muted">YouTube Player Area</p>
        </div>
        <VideoInfoCard />
      </div>

      <AiTabs />

      <TranscriptPanel />
    </div>
  );
}
'@

Write-Utf8File "src/pages/AnalyticsPage.jsx" @'
import Card from "../components/common/Card";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="mt-2 text-muted">
          Study insights, AI usage, quiz performance, and learning trends.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="min-h-[220px]">Chart Area 1</Card>
        <Card className="min-h-[220px]">Chart Area 2</Card>
      </div>
    </div>
  );
}
'@

Write-Utf8File "src/pages/SettingsPage.jsx" @'
import ThemeToggle from "../components/common/ThemeToggle";
import Card from "../components/common/Card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted">
          Themes, appearance, and future customization options.
        </p>
      </div>

      <Card className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Theme</h3>
          <p className="mt-1 text-sm text-muted">Switch between light and dark mode.</p>
        </div>
        <ThemeToggle />
      </Card>
    </div>
  );
}
'@

Write-Host ""
Write-Host "Frontend starter code seeded successfully ✅" -ForegroundColor Cyan
Write-Host "Now run: npm run dev" -ForegroundColor Yellow