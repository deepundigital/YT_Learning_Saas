import { Bot, FileText, Layers3, MessageSquare } from "lucide-react";
import AnimatedCard from "../common/AnimatedCard";
import Card from "../common/Card";

export default function ProductShowcase() {
  return (
    <section className="section-container py-16 md:py-24">
      <div className="mb-10">
        <h2 className="text-3xl font-bold md:text-5xl">
          Designed like a <span className="gradient-text">product</span>
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-muted md:text-base">
          A modular learning software experience built for interaction, speed,
          depth, and future growth.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden rounded-[2rem] p-0">
          <div className="border-b border-white/10 px-6 py-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Product preview
            </p>
            <h3 className="mt-2 text-xl font-semibold">
              A complete AI learning workspace
            </h3>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium">Video layer</p>
                <p className="mt-2 text-sm text-muted">
                  Watch content, fetch metadata, and manage transcript state.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-blue-500/10 p-4">
                <p className="text-sm font-medium">AI generation layer</p>
                <p className="mt-2 text-sm text-slate-300">
                  Create summaries, flashcards, quizzes, and transcript-aware answers.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-violet-500/10 p-4">
                <p className="text-sm font-medium">Revision layer</p>
                <p className="mt-2 text-sm text-slate-300">
                  Learn actively through repeated interaction and structured study flow.
                </p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/60 p-5">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium">Summary card</p>
                  <p className="mt-2 text-sm text-muted">
                    Condensed explanations and key concepts.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium">Quiz block</p>
                  <p className="mt-2 text-sm text-muted">
                    Practice questions generated directly from content.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium">AI chat thread</p>
                  <p className="mt-2 text-sm text-muted">
                    Ask specific questions and get learning-focused responses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          {[
            {
              title: "Structured understanding",
              desc: "Move from passive watching to a guided learning process.",
              icon: FileText,
              tone: "bg-blue-500/10 text-blue-300",
            },
            {
              title: "Revision-first design",
              desc: "Use flashcards, quiz, and chat to retain concepts better.",
              icon: Bot,
              tone: "bg-violet-500/10 text-violet-300",
            },
            {
              title: "Layered experience",
              desc: "Video, transcript, AI, and analytics stay connected in one UI.",
              icon: Layers3,
              tone: "bg-emerald-500/10 text-emerald-300",
            },
            {
              title: "Conversation-based learning",
              desc: "Interact naturally with AI instead of jumping across tools.",
              icon: MessageSquare,
              tone: "bg-cyan-500/10 text-cyan-300",
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <AnimatedCard key={item.title} delay={index * 0.08}>
                <div className={`mb-4 inline-flex rounded-2xl p-3 ${item.tone}`}>
                  <Icon />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm text-muted">{item.desc}</p>
              </AnimatedCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}