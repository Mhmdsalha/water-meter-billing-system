import { cn } from "@/lib/utils";
import * as React from "react";

const variants = {
  default: "border-accent/50 bg-accent/10 text-accent",
  success: "border-success/50 bg-success/10 text-success",
  warning: "border-warning/50 bg-warning/10 text-warning",
  danger: "border-danger/50 bg-danger/10 text-danger",
  muted: "border-border bg-bg text-text-muted"
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-xs font-bold shadow-sm",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
