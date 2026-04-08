import { motion } from "framer-motion";
import { BarChart3, Bot, FileText, MessageSquare, PlayCircle } from "lucide-react";

export default function PremiumHeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="glass rounded-[2rem] border border-white/10 p-6"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Interactive workspace
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            Video + AI + Transcript + Revision
          </h3>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4">
          <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5">
            <div className="text-center">
              <PlayCircle className="mx-auto mb-3 text-blue-300" size={34} />
              <p className="text-sm text-slate-300">YouTube video preview</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium">Transcript status</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                transcript ready
              </span>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                AI enabled
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-blue-500/10 p-4">
            <div className="mb-3 inline-flex rounded-2xl bg-blue-500/10 p-3">
              <FileText className="text-blue-300" />
            </div>
            <p className="font-medium">AI Summary</p>
            <p className="mt-2 text-sm text-slate-300">
              Structured takeaways from long-form content.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-violet-500/10 p-4">
            <div className="mb-3 inline-flex rounded-2xl bg-violet-500/10 p-3">
              <Bot className="text-violet-300" />
            </div>
            <p className="font-medium">Flashcards + Quiz</p>
            <p className="mt-2 text-sm text-slate-300">
              Turn concepts into revision and testing blocks.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-cyan-500/10 p-4">
            <div className="mb-3 flex items-center gap-3">
              <MessageSquare className="text-cyan-300" />
              <BarChart3 className="text-cyan-300" />
            </div>
            <p className="font-medium">Chat + Analytics</p>
            <p className="mt-2 text-sm text-slate-300">
              Ask doubts, monitor progress, and improve study flow.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}