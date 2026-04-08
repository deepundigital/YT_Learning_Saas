export default function SectionHeading({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold md:text-4xl">{title}</h2>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-sm md:text-base text-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}