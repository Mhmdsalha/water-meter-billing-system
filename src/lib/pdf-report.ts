import type { CycleRow, ReadingRow } from "@/lib/db/queries";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function readFont(weight: 400 | 600 | 700) {
  const fontPath = path.join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "noto-sans-arabic",
    "files",
    `noto-sans-arabic-arabic-${weight}-normal.woff2`
  );

  if (!fs.existsSync(fontPath)) return "";
  return fs.readFileSync(fontPath).toString("base64");
}

function fontFaces() {
  const weights: (400 | 600 | 700)[] = [400, 600, 700];
  return weights
    .map((weight) => {
      const font = readFont(weight);
      if (!font) return "";
      return `
        @font-face {
          font-family: "ReportArabic";
          font-style: normal;
          font-weight: ${weight};
          src: url(data:font/woff2;base64,${font}) format("woff2");
        }
      `;
    })
    .join("\n");
}

async function getBrowserLaunchOptions() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean) as string[];

  const browser = candidates.find((candidate) => fs.existsSync(candidate));
  if (browser) {
    return {
      executablePath: browser,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"]
    };
  }

  const chromium = (await import("@sparticuz/chromium")).default;
  return {
    executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--font-render-hinting=medium"]
  };
}

function signedMoney(value: number | null | undefined) {
  const amount = Number(value ?? 0);
  if (amount === 0) return `0.000`;
  return `${amount > 0 ? "+" : "-"}${formatPdfNumber(Math.abs(amount), 3)}`;
}

function currency(value: number | null | undefined, digits = 2) {
  return `${formatPdfNumber(value, digits)} ₪`;
}

function formatPdfNumber(value: number | null | undefined, digits = 2) {
  return Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function formatPdfDate(value: Date) {
  return value.toLocaleDateString("en-GB");
}

function buildReportHtml(cycle: CycleRow, readings: ReadingRow[]) {
  const totalDiscrepancy = Number(cycle.totalDiscrepancy ?? 0);
  const coverage =
    totalDiscrepancy === 0 ? "مغطى بالكامل" : `فرق ${currency(Math.abs(totalDiscrepancy), 3)}`;

  const rows = readings
    .map(
      (reading) => `
        <tr>
          <td class="num">${escapeHtml(reading.apartmentNumber)}</td>
          <td class="name">${escapeHtml(reading.ownerName || "-")}</td>
          <td class="num">${formatPdfNumber(reading.previousReading, 1)}</td>
          <td class="num">${formatPdfNumber(reading.currentReading, 1)}</td>
          <td class="num">${formatPdfNumber(reading.cupsConsumed, 2)}</td>
          <td class="num">${signedMoney(reading.fractionCarried)} ₪</td>
          <td class="num due">${currency(reading.billedAmount, 0)}</td>
        </tr>
      `
    )
    .join("");

  return `<!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <style>
          ${fontFaces()}

          @page {
            size: A4 landscape;
            margin: 6mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            direction: rtl;
            color: #111827;
            background: #ffffff;
            font-family: "ReportArabic", "Noto Sans Arabic", Tahoma, Arial, sans-serif;
            font-size: 11px;
            line-height: 1.55;
          }

          .page {
            width: 100%;
          }

          .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 2px solid #111827;
          }

          h1 {
            margin: 0 0 6px;
            font-size: 22px;
            font-weight: 700;
            line-height: 1.25;
          }

          .subtitle {
            color: #475569;
            font-size: 11px;
            font-weight: 600;
          }

          .meta {
            min-width: 190px;
            text-align: left;
            direction: rtl;
            color: #334155;
            font-size: 10px;
          }

          .summary {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
            margin-bottom: 8px;
          }

          .summary-item {
            min-height: 48px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 6px 8px;
            background: #f8fafc;
          }

          .summary-label {
            margin-bottom: 4px;
            color: #64748b;
            font-size: 9.5px;
            font-weight: 600;
          }

          .summary-value {
            direction: ltr;
            text-align: right;
            color: #0f172a;
            font-size: 13px;
            font-weight: 700;
            white-space: nowrap;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            direction: rtl;
            border: 1px solid #94a3b8;
          }

          col.apartment { width: 8%; }
          col.owner { width: 26%; }
          col.previous { width: 13%; }
          col.current { width: 13%; }
          col.cups { width: 14%; }
          col.fraction { width: 17%; }
          col.due { width: 9%; }

          thead {
            display: table-header-group;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          th {
            padding: 9px 9px;
            border: 1px solid #94a3b8;
            background: #e2e8f0;
            color: #0f172a;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.35;
            text-align: center;
            vertical-align: middle;
            white-space: normal;
          }

          td {
            height: 34px;
            padding: 8px 9px;
            border: 1px solid #cbd5e1;
            color: #1f2937;
            vertical-align: middle;
            background: #ffffff;
            font-size: 11px;
          }

          tbody tr:nth-child(even) td {
            background: #f8fafc;
          }

          .name {
            text-align: right;
            font-weight: 600;
            overflow-wrap: anywhere;
          }

          .num {
            direction: ltr;
            unicode-bidi: isolate;
            text-align: center;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }

          .due {
            font-weight: 700;
            color: #0f172a;
          }

          .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 6px;
            color: #64748b;
            font-size: 9px;
          }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="header">
            <div>
              <h1>تقرير استهلاك المياه</h1>
              <div class="subtitle">دورة قراءة بتاريخ ${escapeHtml(cycle.weekStart)}</div>
            </div>
            <div class="meta">
              <div>تاريخ الإصدار: ${escapeHtml(formatPdfDate(new Date()))}</div>
              <div>رقم الدورة: ${escapeHtml(cycle.id)}</div>
            </div>
          </section>

          <section class="summary" aria-label="ملخص الدورة">
            <div class="summary-item">
              <div class="summary-label">تكلفة المولد / المبلغ المطلوب</div>
              <div class="summary-value">${currency(cycle.generatorCost)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">إجمالي الأكواب</div>
              <div class="summary-value">${formatPdfNumber(cycle.totalCups, 2)} كوب</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">سعر الكوب</div>
              <div class="summary-value">${currency(cycle.exactPricePerCup, 4)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">إجمالي المستحق</div>
              <div class="summary-value">${currency(cycle.totalBilled)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">تغطية المبلغ</div>
              <div class="summary-value">${escapeHtml(coverage)}</div>
            </div>
          </section>

          <table>
            <colgroup>
              <col class="apartment" />
              <col class="owner" />
              <col class="previous" />
              <col class="current" />
              <col class="cups" />
              <col class="fraction" />
              <col class="due" />
            </colgroup>
            <thead>
              <tr>
                <th>رقم الشقة</th>
                <th>الاسم</th>
                <th>القراءة السابقة</th>
                <th>القراءة الحالية</th>
                <th>الأكواب المستهلكة</th>
                <th>الرصيد المتراكم للكسور</th>
                <th>المبلغ المستحق</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <section class="footer">
            <span>نظام إدارة العمارة</span>
            <span>تم توليد التقرير تلقائيًا بعد احتساب الفوترة</span>
          </section>
        </main>
      </body>
    </html>`;
}

export async function generateCycleReportPdf(cycle: CycleRow, readings: ReadingRow[]) {
  const launchOptions = await getBrowserLaunchOptions();
  const browser = await puppeteer.launch({
    executablePath: launchOptions.executablePath,
    headless: true,
    args: launchOptions.args
  });

  try {
    const page = await browser.newPage();
    await page.setContent(buildReportHtml(cycle, readings), { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "6mm",
        right: "6mm",
        bottom: "6mm",
        left: "6mm"
      }
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
