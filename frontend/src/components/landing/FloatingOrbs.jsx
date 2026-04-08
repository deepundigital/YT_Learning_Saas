import { motion } from "framer-motion";

export default function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[120px]"
        animate={{ x: [0, 120, 0], y: [0, -80, 0] }}
        transition={{ duration: 18, repeat: Infinity }}
        style={{ top: "10%", left: "10%" }}
      />

      <motion.div
        className="absolute h-[380px] w-[380px] rounded-full bg-violet-500/20 blur-[120px]"
        animate={{ x: [0, -120, 0], y: [0, 80, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
        style={{ bottom: "10%", right: "10%" }}
      />
    </div>
  );
}