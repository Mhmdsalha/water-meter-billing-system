import { cn } from "@/lib/utils";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import Link from "next/link";

type ActionLinkProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
};

export function ActionLink({ href, label, icon: Icon, variant = "secondary", disabled, className }: ActionLinkProps) {
  return (
    <Link
      href={disabled ? "#" : href}
      aria-disabled={disabled || undefined}
      className={cn(
        "flex min-h-12 items-center justify-between rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition aria-disabled:pointer-events-none aria-disabled:opacity-50",
        variant === "primary"
          ? "bg-accent text-bg hover:bg-accent-dim"
          : "border border-border bg-surface-strong/80 text-text-primary hover:border-accent/60",
        className
      )}
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <ArrowLeft className="h-4 w-4" />
    </Link>
  );
}
