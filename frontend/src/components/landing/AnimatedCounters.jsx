import AnimatedCard from "../common/AnimatedCard";

const items = [
  { number: "5+", label: "AI learning modes" },
  { number: "1", label: "unified study workspace" },
  { number: "∞", label: "content possibilities" },
  { number: "24/7", label: "AI-assisted learning flow" },
];

export default function AnimatedCounters() {
  return (
    <section className="section-container py-12 md:py-16">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => (
          <AnimatedCard key={item.label} delay={index * 0.08}>
            <div className="text-center">
              <p className="text-4xl font-black tracking-tight gradient-text">
                {item.number}
              </p>
              <p className="mt-2 text-sm text-muted">{item.label}</p>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </section>
  );
}