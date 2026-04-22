import { motion } from "framer-motion";

export default function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  const styles = {
    primary:
      "bg-[linear-gradient(135deg,#4f8cff,#8b5cf6)] text-white shadow-[0_0_30px_rgba(79,140,255,0.3)]",
    secondary:
      "glass border border-white/10 text-[var(--text)]",
  };

  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}