import {
  BarChart3,
  Bot,
  FileText,
  MessageSquare,
  MoonStar,
  Timer,
} from "lucide-react";
import AnimatedCard from "../common/AnimatedCard";

const features = [
  {
    title: "AI Summary",
    icon: FileText,
    desc: "Get clean, structured takeaways from long-form video content.",
  },
  {
    title: "AI Chat",
    icon: MessageSquare,
    desc: "Ask questions naturally and learn through conversation.",
  },
  {
    title: "Flashcards",
    icon: Bot,
    desc: "Turn key ideas into revision-ready learning material instantly.",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    desc: "Track learning flow, AI usage, and revision behavior over time.",
  },
  {
    title: "Themes",
    icon: MoonStar,
    desc: "Dark-first premium interface with modular customization ahead.",
  },
  {
    title: "Interactive Study",
    icon: Timer,
    desc: "Combine transcript, AI, quiz, notes, and chat in one smooth flow.",
  },
];

export default function FeatureGrid() {
  return (
    <section className="section-container py-16 md:py-24">
      <div className="mb-10">
        <h2 className="text-3xl font-bold md:text-5xl">
          More than a <span className="gradient-text">video tool</span>
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-muted md:text-base">
          A complete learning system designed to help you understand, revise,
          and interact with content in a smarter way.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <AnimatedCard key={feature.title} delay={index * 0.08}>
              <div className="mb-4 inline-flex rounded-2xl bg-white/5 p-3 transition duration-500 group-hover:scale-110 group-hover:bg-blue-500/10">
                <Icon className="text-blue-300" />
              </div>

              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm text-muted">{feature.desc}</p>
            </AnimatedCard>
          );
        })}
      </div>
    </section>
  );
}