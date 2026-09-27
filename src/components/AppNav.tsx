"use client";

import { cn } from "@/lib/utils";
import { Building2, CalendarDays, LayoutDashboard, ScanLine, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/cycles", label: "الدورات", icon: CalendarDays },
  { href: "/field", label: "القارئ", icon: ScanLine },
  { href: "/apartments", label: "الشقق", icon: Building2 }
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="التنقل الرئيسي" className="contents">
      <div className="hidden items-center gap-1 lg:flex">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={cn("inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", active ? "bg-accent text-bg" : "text-text-muted hover:bg-surface-strong hover:text-text-primary")}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          );
        })}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} title={label} aria-label={label} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-semibold transition", active ? "bg-accent/15 text-accent" : "text-text-muted hover:bg-surface-strong hover:text-text-primary")}>
                <Icon className="h-5 w-5" />{label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
