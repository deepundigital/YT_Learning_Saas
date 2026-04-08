import { motion } from "framer-motion";

const content = [
  "AI Summary",
  "Transcript Import",
  "Flashcards",
  "Quiz Generation",
  "Ask AI",
  "Chat With Video",
  "Analytics Ready",
  "Premium Workspace",
];

export default function MarqueeStrip() {
  const loopItems = [...content, ...content];

  return (
    <section className="overflow-hidden border-y border-white/10 bg-white/[0.03] py-4">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="flex w-max gap-4"
      >
        {loopItems.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="mx-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-300"
          >
            {item}
          </div>
        ))}
      </motion.div>
    </section>
  );
}