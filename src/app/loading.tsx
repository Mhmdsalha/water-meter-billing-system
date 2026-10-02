export default function Loading() {
  return (
    <div aria-label="جارٍ تحميل الصفحة" className="space-y-5" role="status">
      <span className="sr-only">جارٍ تحميل الصفحة</span>
      <div className="h-24 animate-pulse rounded-lg border border-border bg-surface/70" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-lg border border-border bg-surface/70" />)}
      </div>
      <div className="h-64 animate-pulse rounded-lg border border-border bg-surface/70" />
    </div>
  );
}
