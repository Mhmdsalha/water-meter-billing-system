import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import * as React from "react";

type MetricCardProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: LucideIcon;
  valueClassName?: string;
  className?: string;
};

export function MetricCard({ label, value, icon: Icon, valueClassName, className }: MetricCardProps) {
  return (
    <div className={cn("rounded-lg border border-border/80 bg-bg/55 p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-text-muted">{label}</p>
          <p className={cn("number mt-2 text-xl font-bold text-text-primary", valueClassName)}>{value}</p>
        </div>
        {Icon ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-accent/25 bg-accent/10">
            <Icon className="h-6 w-6 text-accent" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
