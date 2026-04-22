import { motion } from "framer-motion";
import {
  BarChart3,
  Home,
  PlayCircle,
  Settings,
  Sparkles,
  ListVideo,
  Users,
  Flame,
  Code2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  {
    label: "Home",
    path: "/dashboard",
    icon: Home,
  },
  {
    label: "Learn",
    path: "/workspace",
    icon: PlayCircle,
  },
  {
    label: "Tracks",
    path: "/playlists",
    icon: ListVideo,
  },
  {
    label: "Stats",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Peers",
    path: "/community",
    icon: Users,
  },
  {
    label: "Streak",
    path: "/dashboard/streak",
    icon: Flame,
  },
  {
    label: "Code",
    path: "/coding-dashboard",
    icon: Code2,
  },
  {
    label: "Config",
    path: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 hidden h-screen w-[80px] shrink-0 flex-col items-center border-r border-white/5 bg-transparent px-2 py-6 md:flex"
    >
      <div className="mb-8 flex items-center justify-center">
        <motion.div
          whileHover={{ scale: 1.06, rotate: -3 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--brand),var(--brand-2))] shadow-lg shadow-brand/20"
        >
          <Sparkles size={18} className="text-white" />
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col gap-2 w-full">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + index * 0.05, duration: 0.35 }}
              className="w-full relative"
            >
              {active && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                />
              )}
              <Link
                to={item.path}
                className={`group flex flex-col items-center justify-center rounded-2xl py-3 mx-2 transition-all ${
                  active
                    ? "text-white"
                    : "text-muted hover:bg-white/5 hover:text-white"
                }`}
                title={item.label}
              >
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                </motion.div>
                <span className={`mt-1.5 text-[9px] uppercase tracking-wider font-semibold ${active ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}>
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.aside>
  );
}