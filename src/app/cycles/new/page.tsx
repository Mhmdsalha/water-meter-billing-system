import { CycleForm } from "@/components/CycleForm";

export default function NewCyclePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">دورة جديدة</h1>
        <p className="mt-1 text-sm text-text-muted">ابدأ دورة قراءة جديدة مع ترحيل القراءات والكسور السابقة تلقائيا.</p>
      </div>
      <CycleForm />
    </div>
  );
}
