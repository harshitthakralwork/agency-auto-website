import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "primary"
    | "emerald"
    | "amber"
    | "indigo"
    | "rose"
    | "orange"
    | "pink"
    | "muted";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    primary: "bg-indigo-950/80 text-indigo-300 border-indigo-800",
    emerald: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
    amber: "bg-amber-950/80 text-amber-300 border-amber-800",
    indigo: "bg-indigo-950/80 text-indigo-300 border-indigo-800",
    rose: "bg-rose-950/80 text-rose-300 border-rose-800",
    orange: "bg-orange-950/80 text-orange-300 border-orange-800",
    pink: "bg-pink-950/80 text-pink-300 border-pink-800",
    muted: "bg-slate-900/60 text-slate-400 border-slate-800",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] tracking-wide uppercase font-semibold",
    md: "px-2.5 py-1 text-xs font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-mono tracking-tight",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
