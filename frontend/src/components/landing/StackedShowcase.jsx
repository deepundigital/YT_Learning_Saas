import { motion } from "framer-motion";

const cards = [
  {
    title: "Summary Layer",
    desc: "Structured explanations generated from video content.",
    tone: "from-blue-500/20 to-transparent",
  },
  {
    title: "Revision Layer",
    desc: "Flashcards and quizzes designed for repeated recall.",
    tone: "from-violet-500/20 to-transparent",
  },
  {
    title: "Interaction Layer",
    desc: "Ask AI, chat with the video, and keep learning active.",
    tone: "from-cyan-400/20 to-transparent",
  },
];

export default function StackedShowcase() {
  return (
    <section className="section-container py-20 md:py-28">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-xl">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-blue-300">
            Multi-layer experience
          </p>
          <h2 className="text-4xl font-black leading-tight md:text-5xl">
            Built with <span className="gradient-text">depth, motion, and focus.</span>
          </h2>
          <p className="mt-5 text-sm text-muted md:text-base">
            Instead of jumping across tools, the platform keeps summary, transcript,
            revision, and AI interaction inside one connected experience.
          </p>
        </div>

        <div className="relative min-h-[420px]">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.12,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -10 }}
              className="absolute left-0 right-0 mx-auto w-full max-w-[520px]"
              style={{
                top: `${index * 72}px`,
                zIndex: 10 + index,
              }}
            >
              <div className={`glass premium-border rounded-[2rem] border border-white/10 bg-gradient-to-br ${card.tone} p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]`}>
                <p className="text-lg font-semibold">{card.title}</p>
                <p className="mt-3 text-sm text-muted">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}