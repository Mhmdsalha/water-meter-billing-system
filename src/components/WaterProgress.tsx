export function WaterProgress({ value, label }: { value: number; label?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-2">
      {label ? <div className="text-sm text-text-muted">{label}</div> : null}
      <div className="relative h-3 overflow-hidden rounded-full border border-accent/25 bg-bg">
        <div
          className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-accent to-success transition-[width] duration-700"
          style={{ width: `${safeValue}%` }}
        />
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/25" />
      </div>
    </div>
  );
}
