import AnimatedCard from "../common/AnimatedCard";

const stats = [
  { value: "1 workspace", label: "Video, transcript, AI, quiz, and revision in one flow" },
  { value: "5 AI modes", label: "Summary, flashcards, quiz, ask AI, and chat" },
  { value: "Smart fallback", label: "Transcript fetch, manual import, and DB fallback support" },
  { value: "Future ready", label: "Theme system, analytics, scaling, and modular structure" },
];

export default function StatsStrip() {
  return (
    <section className="section-container py-8 md:py-12">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => (
          <AnimatedCard key={item.label} delay={index * 0.08}>
            <p className="text-2xl font-bold tracking-tight gradient-text">{item.value}</p>
            <p className="mt-2 text-sm text-muted">{item.label}</p>
          </AnimatedCard>
        ))}
      </div>
    </section>
  );
}