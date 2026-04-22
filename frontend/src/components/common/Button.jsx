import { motion } from "framer-motion";

export default function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  const styles = {
    primary:
      "bg-[linear-gradient(110deg,var(--brand),var(--brand-2))] text-white shadow-[0_4px_14px_rgba(59,130,246,0.2)] border border-white/10 hover:shadow-[0_6px_20px_rgba(59,130,246,0.3)]",
    secondary:
      "bg-transparent border border-white/10 text-[var(--text)] hover:bg-white/5",
    danger:
      "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20",
  };

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: "easeInOut" }}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}