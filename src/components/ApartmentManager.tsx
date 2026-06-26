"use client";

import type { ApartmentRow } from "@/lib/db/queries";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Edit3, Eye, Plus, Power, X } from "lucide-react";

export function ApartmentManager({ initialApartments }: { initialApartments: ApartmentRow[] }) {
  const router = useRouter();
  const [apartments, setApartments] = useState(initialApartments);
  const [editingApartment, setEditingApartment] = useState<ApartmentRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function sortApartments(items: ApartmentRow[]) {
    return [...items].sort((a, b) => Number(a.number) - Number(b.number) || a.number.localeCompare(b.number, "ar"));
  }

  async function save(formData: FormData) {
    setLoading(true);
    setError(null);
    const isEditing = Boolean(editingApartment);
    const response = await fetch(isEditing ? `/api/apartments/${editingApartment?.id}` : "/api/apartments", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: formData.get("number"),
        floor: formData.get("floor"),
        ownerName: formData.get("ownerName"),
        ...(isEditing ? { isActive: formData.get("isActive") === "on" } : {})
      })
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "تعذر حفظ بيانات الشقة");
      return;
    }
    setApartments((current) =>
      sortApartments(
        isEditing
          ? current.map((item) => (item.id === data.apartment.id ? data.apartment : item))
          : [...current, data.apartment]
      )
    );
    setEditingApartment(null);
    router.refresh();
  }

  async function toggle(apartment: ApartmentRow) {
    const response = await fetch(`/api/apartments/${apartment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !apartment.isActive })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "تعذر تحديث حالة الشقة");
      return;
    }
    setApartments((current) => current.map((item) => (item.id === apartment.id ? data.apartment : item)));
    if (editingApartment?.id === apartment.id) {
      setEditingApartment(data.apartment);
    }
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Card className="h-fit lg:sticky lg:top-28">
        <CardHeader>
          <div>
            <CardTitle>{editingApartment ? "تعديل بيانات الشقة" : "إضافة شقة"}</CardTitle>
            <CardDescription>
              {editingApartment ? "عدّل رقم الشقة أو الطابق أو اسم المالك أو الحالة." : "أدخل الشقق بنفسك حسب ترتيب العمارة."}
            </CardDescription>
          </div>
        </CardHeader>
        <form key={editingApartment?.id ?? "new"} action={save} className="space-y-3">
          <label className="block text-sm text-text-muted">
            رقم الشقة
            <Input
              name="number"
              required
              placeholder="101"
              defaultValue={editingApartment?.number ?? ""}
              className="number mt-1 text-left"
            />
          </label>
          <label className="block text-sm text-text-muted">
            الطابق
            <Input
              name="floor"
              type="number"
              placeholder="1"
              defaultValue={editingApartment?.floor ?? ""}
              className="number mt-1 text-left"
            />
          </label>
          <label className="block text-sm text-text-muted">
            اسم المالك
            <Input name="ownerName" placeholder="اسم المالك" defaultValue={editingApartment?.ownerName ?? ""} className="mt-1" />
          </label>
          {editingApartment ? (
            <label className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-bg/70 px-3 text-sm text-text-muted">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={editingApartment.isActive}
                className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent"
              />
              الشقة فعالة
            </label>
          ) : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full min-h-12">
            {editingApartment ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingApartment ? "حفظ التعديل" : "إضافة"}
          </Button>
          {editingApartment ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setEditingApartment(null);
                setError(null);
              }}
            >
              <X className="h-4 w-4" />
              إلغاء التعديل
            </Button>
          ) : null}
        </form>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>الشقق</CardTitle>
            <CardDescription>أضف الشقق وعدّل بياناتها وتحكم بحالتها بدون حذف السجل التاريخي.</CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-3 md:hidden">
          {apartments.length === 0 ? (
            <div className="rounded-lg border border-border bg-bg/70 p-5 text-center text-sm text-text-muted">
              لا توجد شقق بعد. ابدأ بإضافة الشقق من النموذج.
            </div>
          ) : null}
          {apartments.map((apartment) => (
            <article key={apartment.id} className="rounded-lg border border-border bg-bg/70 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-text-muted">شقة</p>
                  <h2 className="number mt-1 text-3xl font-bold leading-none">{apartment.number}</h2>
                </div>
                <Badge variant={apartment.isActive ? "success" : "muted"}>
                  {apartment.isActive ? "فعالة" : "معطلة"}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-md border border-border/80 bg-surface/60 p-3">
                  <p className="text-xs text-text-muted">الطابق</p>
                  <p className="number mt-1 text-lg font-bold">{apartment.floor ?? "-"}</p>
                </div>
                <div className="rounded-md border border-border/80 bg-surface/60 p-3">
                  <p className="text-xs text-text-muted">المالك</p>
                  <p className="mt-1 truncate text-sm font-bold">{apartment.ownerName ?? "-"}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button type="button" size="sm" variant="secondary" className="min-h-11" onClick={() => setEditingApartment(apartment)}>
                  <Edit3 className="h-4 w-4" />
                  تعديل
                </Button>
                <Button type="button" size="sm" variant="secondary" className="min-h-11" onClick={() => toggle(apartment)}>
                  <Power className="h-4 w-4" />
                  {apartment.isActive ? "تعطيل" : "تفعيل"}
                </Button>
                <Link
                  href={`/apartments/${apartment.id}`}
                  className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-text-muted hover:bg-surface hover:text-text-primary"
                >
                  <Eye className="h-4 w-4" />
                  السجل
                </Link>
              </div>
            </article>
          ))}
        </div>
        <TableWrap className="hidden md:block">
          <Table>
            <thead>
              <tr>
                <Th>الشقة</Th>
                <Th>الطابق</Th>
                <Th>المالك</Th>
                <Th>الحالة</Th>
                <Th>إجراء</Th>
              </tr>
            </thead>
            <tbody>
              {apartments.length === 0 ? (
                <tr>
                  <Td colSpan={5} className="py-8 text-center text-text-muted">
                    لا توجد شقق بعد. ابدأ بإضافة الشقق من النموذج.
                  </Td>
                </tr>
              ) : null}
              {apartments.map((apartment) => (
                <tr key={apartment.id}>
                  <Td className="number">{apartment.number}</Td>
                  <Td className="number">{apartment.floor ?? "-"}</Td>
                  <Td>{apartment.ownerName ?? "-"}</Td>
                  <Td>
                    <Badge variant={apartment.isActive ? "success" : "muted"}>
                      {apartment.isActive ? "فعالة" : "معطلة"}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => setEditingApartment(apartment)}>
                        <Edit3 className="h-4 w-4" />
                        تعديل
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => toggle(apartment)}>
                        <Power className="h-4 w-4" />
                        {apartment.isActive ? "تعطيل" : "تفعيل"}
                      </Button>
                      <Link
                        href={`/apartments/${apartment.id}`}
                        className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-text-muted hover:bg-bg hover:text-text-primary"
                      >
                        <Eye className="h-4 w-4" />
                        السجل
                      </Link>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
