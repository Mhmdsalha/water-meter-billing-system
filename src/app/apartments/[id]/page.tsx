import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { getApartmentHistory } from "@/lib/db/queries";
import { formatCups, formatMoney } from "@/lib/format";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ApartmentDetailPage({ params }: { params: { id: string } }) {
  const history = await getApartmentHistory(Number(params.id));
  if (!history) notFound();

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>الشقة {history.apartment.number}</CardTitle>
            <CardDescription>سجل القراءات وتطور الكسور المرحلة.</CardDescription>
          </div>
          <Badge variant={history.apartment.isActive ? "success" : "muted"}>
            {history.apartment.isActive ? "فعالة" : "معطلة"}
          </Badge>
        </CardHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-bg p-3">
            <p className="text-sm text-text-muted">المالك</p>
            <p className="mt-1 font-semibold">{history.apartment.ownerName ?? "-"}</p>
          </div>
          <div className="rounded-md border border-border bg-bg p-3">
            <p className="text-sm text-text-muted">الطابق</p>
            <p className="number mt-1 font-semibold">{history.apartment.floor ?? "-"}</p>
          </div>
          <div className="rounded-md border border-border bg-bg p-3">
            <p className="text-sm text-text-muted">عدد السجلات</p>
            <p className="number mt-1 font-semibold">{history.readings.length}</p>
          </div>
        </div>
      </Card>

      <Card>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>تاريخ القراءة</Th>
                <Th>السابق</Th>
                <Th>الحالي</Th>
                <Th>الاستهلاك</Th>
                <Th>كسر سابق</Th>
                <Th>مستحق</Th>
                <Th>كسر مرحل</Th>
                <Th>الحالة</Th>
              </tr>
            </thead>
            <tbody>
              {history.readings.map((reading) => (
                <tr key={reading.id}>
                  <Td className="number">{reading.weekStart}</Td>
                  <Td className="number">{formatCups(reading.previousReading, 4)}</Td>
                  <Td className="number">{formatCups(reading.currentReading, 4)}</Td>
                  <Td className="number">{formatCups(reading.cupsConsumed, 2)}</Td>
                  <Td className="number">₪ {formatMoney(reading.fractionFromPrev, 3)}</Td>
                  <Td className="number">₪ {formatMoney(reading.billedAmount, 0)}</Td>
                  <Td className="number">₪ {formatMoney(reading.fractionCarried, 3)}</Td>
                  <Td>
                    <Badge variant={reading.cycleStatus === "finalized" ? "success" : "warning"}>
                      {reading.cycleStatus === "finalized" ? "مغلقة" : "مفتوحة"}
                    </Badge>
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
