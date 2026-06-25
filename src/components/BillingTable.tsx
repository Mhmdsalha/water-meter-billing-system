import type { CycleRow, ReadingRow } from "@/lib/db/queries";
import { formatCups, formatMoney } from "@/lib/format";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";

export function BillingTable({ cycle, readings }: { cycle: CycleRow; readings: ReadingRow[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>جدول الفوترة</CardTitle>
          <CardDescription>
            أي فرق ناتج عن التقريب للأسفل لا يضيع، بل يرحل تلقائيا على نفس الشقق في الدورة القادمة.
          </CardDescription>
        </div>
        <Badge variant={cycle.status === "finalized" ? "success" : "warning"}>
          {cycle.status === "finalized" ? "مغلقة" : "مفتوحة"}
        </Badge>
      </CardHeader>
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>الشقة</Th>
              <Th>المالك</Th>
              <Th>السابق</Th>
              <Th>الحالي</Th>
              <Th>أكواب</Th>
              <Th>كسر سابق</Th>
              <Th>خام</Th>
              <Th>مستحق</Th>
              <Th>كسر مرحل</Th>
            </tr>
          </thead>
          <tbody>
            {readings.map((reading) => (
              <tr key={reading.id}>
                <Td className="number">{reading.apartmentNumber}</Td>
                <Td>{reading.ownerName ?? "-"}</Td>
                <Td className="number">{formatCups(reading.previousReading, 4)}</Td>
                <Td className="number">{formatCups(reading.currentReading, 4)}</Td>
                <Td className="number">{formatCups(reading.cupsConsumed, 2)}</Td>
                <Td className="number">₪ {formatMoney(reading.fractionFromPrev, 3)}</Td>
                <Td className="number">₪ {formatMoney(reading.rawAmount, 3)}</Td>
                <Td className="number text-success">₪ {formatMoney(reading.billedAmount, 0)}</Td>
                <Td className="number">₪ {formatMoney(reading.fractionCarried, 3)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </Card>
  );
}
