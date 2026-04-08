import { motion } from "framer-motion";

export default function AnimatedCard({
  children,
  className = "",
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{
        delay,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -10,
        scale: 1.02,
      }}
      className={`group relative ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-cyan-400/10 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100" />
      <div className="glass premium-border relative h-full rounded-[1.75rem] border border-white/10 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition duration-500 group-hover:border-white/20 group-hover:shadow-[0_40px_120px_rgba(79,140,255,0.15)]">
        {children}
      </div>
    </motion.div>
  );
}