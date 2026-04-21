import { motion } from "framer-motion";
import {
  BarChart3,
  Home,
  PlayCircle,
  Settings,
  Sparkles,
  ListVideo,
  FileText,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: Home,
  },
  {
    label: "Workspace",
    path: "/workspace",
    icon: PlayCircle,
  },
  {
    label: "Progress",
    path: "/playlists",
    icon: ListVideo,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
  {
    label: "Assignment",
    path: "/assignment-solver",
    icon: FileText,
  },
  {
    label: "Community",
    path: "/community",
    icon: Users,
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass premium-border sticky top-0 hidden h-screen w-[92px] shrink-0 flex-col border-r border-white/10 px-3 py-4 md:flex"
    >
      <div className="mb-5 flex items-center justify-center">
        <motion.div
          whileHover={{ scale: 1.06, rotate: -3 }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4f8cff,#8b5cf6)] shadow-[0_0_30px_rgba(79,140,255,0.25)]"
        >
          <Sparkles size={20} className="text-white" />
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.05, duration: 0.35 }}
            >
              <Link
                to={item.path}
                className={`group flex flex-col items-center justify-center rounded-2xl px-2 py-3 transition ${
                  active
                    ? "bg-blue-500/12 text-blue-300"
                    : "text-muted hover:bg-white/5 hover:text-[var(--text)]"
                }`}
                title={item.label}
              >
                <motion.div whileHover={{ y: -2, scale: 1.04 }}>
                  <Icon size={19} />
                </motion.div>
                <span className="mt-2 text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
          Pro
        </p>
        <p className="mt-1 text-xs font-semibold">AI Mode</p>
      </div>
    </motion.aside>
  );
}