import { motion } from "framer-motion";

export default function RevealText({ children, className = "" }) {
  return (
    <div className="reveal-mask">
      <motion.div
        initial={{ y: "110%", opacity: 0 }}
        whileInView={{ y: "0%", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}