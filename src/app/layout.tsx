import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { Noto_Sans_Arabic } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { cn } from "@/lib/utils";

const arabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap"
});

export const metadata: Metadata = {
  title: "نظام المياه",
  description: "إدارة قراءات وفواتير مضخة المياه الدورية",
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1
};

const navItems = [
  { href: "/", label: "الرئيسية" },
  { href: "/apartments", label: "الشقق" },
  { href: "/cycles", label: "الدورات" },
  { href: "/field", label: "القارئ الميداني" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cn(arabic.variable, GeistMono.variable, "dark")}>
      <body className="font-arabic antialiased">
        <ServiceWorkerRegister />
        <div className="app-shell min-h-screen">
          <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-6 lg:px-8">
          <header className="sticky top-0 z-40 mb-4 rounded-lg border border-border/80 bg-bg/80 px-3 py-3 shadow-panel backdrop-blur-xl sm:mb-6 sm:px-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Link href="/" className="inline-flex items-center gap-3 text-lg font-bold tracking-normal text-text-primary sm:text-xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent">
                  م
                </span>
                <span>نظام المياه</span>
              </Link>
              <nav className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="shrink-0 rounded-md border border-border/80 bg-surface-strong/70 px-3 py-2 text-sm font-semibold text-text-muted shadow-sm transition hover:border-accent/60 hover:bg-surface-strong hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="flex-1 pb-24 sm:pb-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
