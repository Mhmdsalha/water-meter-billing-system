import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { Noto_Sans_Arabic } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { Droplets } from "lucide-react";
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
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cn(arabic.variable, GeistMono.variable, "dark")}>
      <body className="font-arabic antialiased">
        <ServiceWorkerRegister />
        <div className="app-shell min-h-screen">
          <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-6 lg:px-8">
          <header className="sticky top-0 z-40 mb-6 border-b border-border/80 bg-bg/90 py-3 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="inline-flex items-center gap-3 text-lg font-bold text-text-primary sm:text-xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent"><Droplets className="h-5 w-5" /></span>
                <span>إدارة المياه</span>
              </Link>
              <AppNav />
            </div>
          </header>
          <main className="flex-1 pb-28 lg:pb-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
