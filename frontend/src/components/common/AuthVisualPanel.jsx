import { motion } from "framer-motion";
import { BrainCircuit, MessageSquareMore, Sparkles, Zap } from "lucide-react";

const cards = [
  {
    icon: Sparkles,
    title: "AI Summary",
    desc: "Long videos ko clean notes me convert karo.",
    tone: "bg-blue-500/10 text-blue-300",
  },
  {
    icon: BrainCircuit,
    title: "Smart Revision",
    desc: "Flashcards aur quizzes se fast retention.",
    tone: "bg-violet-500/10 text-violet-300",
  },
  {
    icon: MessageSquareMore,
    title: "AI Chat",
    desc: "Video ke saath conversational learning.",
    tone: "bg-cyan-500/10 text-cyan-300",
  },
  {
    icon: Zap,
    title: "Focused Workflow",
    desc: "Video, playlist, AI aur progress ek hi place par.",
    tone: "bg-emerald-500/10 text-emerald-300",
  },
];

export default function AuthVisualPanel({
  badge = "Premium Learning Flow",
  title = "Interactive learning built like a modern SaaS product.",
  subtitle = "Watch, revise, ask AI, and track progress in one premium workspace.",
}) {
  return (
    <div className="relative hidden min-h-[640px] overflow-hidden rounded-[2rem] xl:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,140,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.16),transparent_30%),linear-gradient(180deg,rgba(10,15,28,0.88),rgba(8,12,24,0.96))]" />

      <div className="absolute -left-10 top-12 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col justify-between p-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-5 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300"
          >
            {badge}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.55 }}
            className="max-w-xl text-4xl font-black leading-[1.02] tracking-[-0.03em]"
          >
            {title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.55 }}
            className="mt-5 max-w-lg text-sm text-muted md:text-base"
          >
            {subtitle}
          </motion.p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + index * 0.07, duration: 0.45 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="glass premium-border rounded-[1.5rem] p-5"
              >
                <div className={`mb-4 inline-flex rounded-2xl p-3 ${card.tone}`}>
                  <Icon size={18} />
                </div>
                <h3 className="text-base font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm text-muted">{card.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}