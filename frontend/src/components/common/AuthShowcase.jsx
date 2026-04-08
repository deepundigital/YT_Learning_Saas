import { motion } from "framer-motion";
import {
  BrainCircuit,
  MessageSquareMore,
  PlayCircle,
  Sparkles,
} from "lucide-react";

const cards = [
  {
    icon: Sparkles,
    title: "AI Summary",
    text: "Turn videos into clean notes instantly.",
    tone: "bg-blue-500/10 text-blue-300",
  },
  {
    icon: BrainCircuit,
    title: "Smart Quiz",
    text: "Practice concepts with playable quizzes.",
    tone: "bg-violet-500/10 text-violet-300",
  },
  {
    icon: MessageSquareMore,
    title: "AI Chat",
    text: "Ask doubts while learning.",
    tone: "bg-cyan-500/10 text-cyan-300",
  },
];

export default function AuthShowcase({
  title = "Catch your biggest learning opportunities",
  subtitle = "Build playlists, summarize videos, revise with flashcards, and chat with video content in a polished AI learning workspace.",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45 }}
      className="relative hidden xl:block"
    >
      <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#0a1228_0%,#09111f_100%)] p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,140,255,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.16),transparent_24%)]" />

        <motion.div
          animate={{ y: [0, -8, 0], x: [0, 6, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-10 top-8 h-36 w-36 rounded-full bg-blue-500/20 blur-3xl"
        />

        <motion.div
          animate={{ y: [0, 8, 0], x: [0, -6, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 right-0 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl"
        />

        <div className="relative rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02))] p-5">
          <div className="absolute inset-0 rounded-[1.75rem] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_55%)]" />

          <div className="relative z-10 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="glass premium-border rounded-[1.2rem] p-5"
              >
                <div className={`mb-3 inline-flex rounded-2xl p-3 ${cards[0].tone}`}>
                  <Sparkles size={18} />
                </div>
                <p className="text-base font-semibold">{cards[0].title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{cards[0].text}</p>
              </motion.div>

              <div />

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="glass premium-border rounded-[1.2rem] p-5"
              >
                <div className={`mb-3 inline-flex rounded-2xl p-3 ${cards[1].tone}`}>
                  <BrainCircuit size={18} />
                </div>
                <p className="text-base font-semibold">{cards[1].title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{cards[1].text}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="glass premium-border mt-8 rounded-[1.2rem] p-5"
              >
                <div className={`mb-3 inline-flex rounded-2xl p-3 ${cards[2].tone}`}>
                  <MessageSquareMore size={18} />
                </div>
                <p className="text-base font-semibold">{cards[2].title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{cards[2].text}</p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.4 }}
              className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 backdrop-blur-xl"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-blue-500/10 p-3">
                <PlayCircle className="text-blue-300" size={20} />
              </div>

              <h3 className="max-w-[560px] text-[1.75rem] font-black leading-[1.02] tracking-[-0.03em]">
                {title}
              </h3>

              <p className="mt-4 max-w-[600px] text-sm leading-6 text-slate-300">
                {subtitle}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="flex -space-x-3">
                  {["A", "K", "R", "S"].map((item, i) => (
                    <div
                      key={item + i}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted">
                  Trusted by learners building better study habits
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}