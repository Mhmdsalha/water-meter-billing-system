"use client";

import type { CycleRow, ReadingRow } from "@/lib/db/queries";
import { formatCups } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, RotateCw, Save } from "lucide-react";

export function ReadingsEditor({ cycle, readings }: { cycle: CycleRow; readings: ReadingRow[] }) {
  const router = useRouter();
  const [values, setValues] = useState(() =>
    Object.fromEntries(readings.map((reading) => [reading.id, String(reading.currentReading)]))
  );
  const [previousValues, setPreviousValues] = useState(() =>
    Object.fromEntries(readings.map((reading) => [reading.id, String(reading.previousReading)]))
  );
  const [notes, setNotes] = useState(() => Object.fromEntries(readings.map((reading) => [reading.id, reading.notes ?? ""])));
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isFinalized = cycle.status === "finalized";

  const progress = useMemo(() => {
    const read = readings.filter((reading) => reading.isRead).length;
    return { read, total: readings.length };
  }, [readings]);

  async function save(reading: ReadingRow) {
    setSavingId(reading.id);
    setError(null);
    const response = await fetch(`/api/readings/${reading.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        previousReading: reading.canEditPrevious ? previousValues[reading.id] : undefined,
        currentReading: values[reading.id],
        notes: notes[reading.id]
      })
    });
    const data = await response.json();
    setSavingId(null);
    if (!response.ok) {
      setError(data.error ?? "تعذر حفظ القراءة");
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>إدخال القراءات</CardTitle>
          <CardDescription>
            تم إدخال {progress.read} من {progress.total} شقة.
          </CardDescription>
        </div>
        {isFinalized ? (
          <Badge variant="warning">
            <RotateCw className="ml-1 h-3.5 w-3.5" />
            مغلقة، وأي تعديل يعيد الحساب
          </Badge>
        ) : null}
      </CardHeader>
      {error ? <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>الشقة</Th>
              <Th>المالك</Th>
              <Th>السابق</Th>
              <Th>الحالي</Th>
              <Th>الاستهلاك</Th>
              <Th>الحالة</Th>
              <Th>ملاحظات</Th>
              <Th>حفظ</Th>
            </tr>
          </thead>
          <tbody>
            {readings.map((reading) => {
              const previous = reading.canEditPrevious ? Number(previousValues[reading.id] || reading.previousReading) : reading.previousReading;
              const current = Number(values[reading.id] || previous);
              const preview = Math.max(0, current - previous);
              return (
                <tr key={reading.id}>
                  <Td className="number">{reading.apartmentNumber}</Td>
                  <Td>{reading.ownerName ?? "-"}</Td>
                  <Td>
                    {reading.canEditPrevious ? (
                      <Input
                        disabled={savingId === reading.id}
                        inputMode="decimal"
                        pattern="^\\d+(\\.\\d{1,4})?$"
                        className="number min-w-28"
                        value={previousValues[reading.id]}
                        onChange={(event) =>
                          setPreviousValues((currentValues) => ({ ...currentValues, [reading.id]: event.target.value }))
                        }
                      />
                    ) : (
                      <span className="number block">{formatCups(reading.previousReading, 4)}</span>
                    )}
                  </Td>
                  <Td>
                    <Input
                      disabled={savingId === reading.id}
                      inputMode="decimal"
                      pattern="^\\d+(\\.\\d{1,4})?$"
                      className="number min-w-28"
                      value={values[reading.id]}
                      onChange={(event) => setValues((currentValues) => ({ ...currentValues, [reading.id]: event.target.value }))}
                    />
                  </Td>
                  <Td className="number">{formatCups(preview, 2)}</Td>
                  <Td>
                    <Badge variant={reading.isRead ? "success" : "warning"}>
                      {reading.isRead ? "مقروءة" : "بانتظار"}
                    </Badge>
                  </Td>
                  <Td>
                    <Input
                      disabled={savingId === reading.id}
                      value={notes[reading.id]}
                      onChange={(event) => setNotes((currentNotes) => ({ ...currentNotes, [reading.id]: event.target.value }))}
                    />
                  </Td>
                  <Td>
                    <Button type="button" size="sm" disabled={savingId === reading.id} onClick={() => save(reading)}>
                      {reading.isRead ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                      حفظ
                    </Button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableWrap>
    </Card>
  );
}
