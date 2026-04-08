import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";

export default function FinalCtaSection() {
  const navigate = useNavigate();

  return (
    <section className="section-container py-20 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-cyan-400/10 p-8 shadow-[0_0_80px_rgba(59,130,246,0.08)] md:p-12"
      >
        <div className="relative z-10 max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-blue-300">
            Start your learning flow
          </p>

          <h2 className="text-3xl font-black leading-tight md:text-5xl">
            Build a smarter way to learn from every video.
          </h2>

          <p className="mt-5 max-w-2xl text-sm text-slate-300 md:text-base">
            Open your workspace, import transcripts when needed, generate AI study
            material, and turn passive watching into structured understanding.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button className="gap-2" onClick={() => navigate("/video/jNQXAC9IVRw")}>
              Launch Demo Workspace
              <ArrowRight size={16} />
            </Button>

            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Open Dashboard
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}