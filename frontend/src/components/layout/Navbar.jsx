import { motion } from "framer-motion";
import { Bell, LayoutDashboard, LogIn, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "../common/ThemeToggle";

export default function Navbar() {
  const token = localStorage.getItem("token");
  const isLoggedIn = Boolean(token);

  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-30 border-b border-white/10 bg-[color:var(--bg)]/70 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Interactive learning suite
          </p>
          <h1 className="truncate text-lg font-bold md:text-xl">
            Premium SaaS Workspace
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass hidden items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 lg:flex">
            <Search size={16} className="text-muted" />
            <input
              placeholder="Search videos, playlists..."
              className="w-48 bg-transparent text-sm outline-none placeholder:text-[var(--muted-2)]"
            />
          </div>

          <motion.button
            whileHover={{ y: -2, scale: 1.03 }}
            className="glass hidden rounded-2xl p-3 md:block"
          >
            <Bell size={18} />
          </motion.button>

          <ThemeToggle />

          <div className="hidden items-center gap-3 md:flex">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#4f8cff,#8b5cf6)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(79,140,255,0.22)] transition hover:scale-[1.02]"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--text)] transition hover:border-white/20 hover:bg-white/10"
                >
                  <LogIn size={16} />
                  Login
                </Link>

                <Link
                  to="/register"
                  className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#4f8cff,#8b5cf6)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(79,140,255,0.22)] transition hover:scale-[1.02]"
                >
                  <Sparkles size={16} />
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 md:hidden">
        <div className="flex gap-3">
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#4f8cff,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[var(--text)]"
              >
                <LogIn size={16} />
                Login
              </Link>

              <Link
                to="/register"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#4f8cff,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white"
              >
                <Sparkles size={16} />
                Start
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}