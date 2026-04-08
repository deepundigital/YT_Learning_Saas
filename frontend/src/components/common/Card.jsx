export default function Card({ children, className = "" }) {
  return (
    <div
      className={`glass premium-border rounded-[1.75rem] p-5 shadow-[0_14px_45px_rgba(0,0,0,0.28)] ${className}`}
    >
      {children}
    </div>
  );
}