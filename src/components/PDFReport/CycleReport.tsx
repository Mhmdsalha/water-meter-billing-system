import type { CycleRow, ReadingRow } from "@/lib/db/queries";
import { formatCups, formatMoney } from "@/lib/format";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

Font.register({
  family: "NotoSansArabic",
  fonts: [
    {
      src: "https://github.com/google/fonts/raw/main/ofl/notosansarabic/NotoSansArabic%5Bwdth,wght%5D.ttf",
      fontWeight: 400
    },
    {
      src: "https://github.com/google/fonts/raw/main/ofl/notosansarabic/NotoSansArabic%5Bwdth,wght%5D.ttf",
      fontWeight: 700
    }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: "NotoSansArabic",
    color: "#111827",
    fontSize: 10,
    textAlign: "right"
  },
  header: {
    border: "1 solid #111827",
    padding: 14,
    marginBottom: 12,
    textAlign: "center"
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 6
  },
  summary: {
    border: "1 solid #374151",
    padding: 10,
    marginBottom: 12,
    gap: 5
  },
  row: {
    flexDirection: "row-reverse",
    borderBottom: "1 solid #d1d5db",
    minHeight: 26,
    alignItems: "center"
  },
  headerRow: {
    backgroundColor: "#e5e7eb",
    fontWeight: 700
  },
  cell: {
    padding: 5,
    borderLeft: "1 solid #d1d5db",
    textAlign: "right"
  },
  apt: { width: "12%" },
  owner: { width: "22%" },
  number: { width: "13%", textAlign: "left" },
  amount: { width: "14%", textAlign: "left" },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 28,
    right: 28,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    color: "#6b7280",
    fontSize: 9
  },
  fractions: {
    marginTop: 12,
    border: "1 solid #d1d5db",
    padding: 10
  }
});

export function CycleReport({ cycle, readings }: { cycle: CycleRow; readings: ReadingRow[] }) {
  const today = new Date().toLocaleDateString("ar-SA");
  const totalDiscrepancy = Number(cycle.totalDiscrepancy ?? 0);
  const coverage =
    totalDiscrepancy <= 0 ? "مغطى بالكامل" : `غير مغطى ₪ ${formatMoney(totalDiscrepancy, 3)}`;
  const fractions = readings
    .filter((reading) => Number(reading.fractionCarried ?? 0) > 0)
    .map((reading) => `${reading.apartmentNumber}: ${formatMoney(reading.fractionCarried, 3)} ₪`)
    .join(" | ");

  return (
    <Document title={`تقرير المياه ${cycle.weekStart}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>تقرير استهلاك المياه</Text>
          <Text>تاريخ القراءة: {cycle.weekStart}</Text>
          <Text>تاريخ الإصدار: {today}</Text>
        </View>

        <View style={styles.summary}>
          <Text>تكلفة المولد: ₪ {formatMoney(cycle.generatorCost)}</Text>
          <Text>إجمالي الأكواب: {formatCups(cycle.totalCups, 2)} كوب</Text>
          <Text>سعر الكوب: ₪ {formatMoney(cycle.exactPricePerCup, 4)}</Text>
          <Text>إجمالي المستحق: ₪ {formatMoney(cycle.totalBilled)}</Text>
          <Text>تغطية المبلغ: {coverage}</Text>
        </View>

        <View>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.apt]}>الشقة</Text>
            <Text style={[styles.cell, styles.owner]}>المالك</Text>
            <Text style={[styles.cell, styles.number]}>سابق</Text>
            <Text style={[styles.cell, styles.number]}>حالي</Text>
            <Text style={[styles.cell, styles.number]}>أكواب</Text>
            <Text style={[styles.cell, styles.amount]}>مستحق</Text>
          </View>
          {readings.map((reading) => (
            <View key={reading.id} style={styles.row}>
              <Text style={[styles.cell, styles.apt]}>{reading.apartmentNumber}</Text>
              <Text style={[styles.cell, styles.owner]}>{reading.ownerName ?? "-"}</Text>
              <Text style={[styles.cell, styles.number]}>{formatCups(reading.previousReading, 1)}</Text>
              <Text style={[styles.cell, styles.number]}>{formatCups(reading.currentReading, 1)}</Text>
              <Text style={[styles.cell, styles.number]}>{formatCups(reading.cupsConsumed, 2)}</Text>
              <Text style={[styles.cell, styles.amount]}>₪ {formatMoney(reading.billedAmount, 0)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.fractions}>
          <Text>كسور مرحلة للأسبوع القادم:</Text>
          <Text>{fractions || "لا توجد كسور مرحلة"}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>نظام إدارة العمارة</Text>
          <Text render={({ pageNumber, totalPages }) => `صفحة ${pageNumber} من ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
