import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral"
    | "indigo"
    | "purple";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border transition-colors select-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Quick helper to map backend status to badge variant
export function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase().replace(/_/g, " ") || "unknown";

  let variant: BadgeProps["variant"] = "default";
  if (["active", "approved", "completed", "enrolled", "matches"].includes(status?.toLowerCase())) {
    variant = "success";
  } else if (["pending", "scheduled", "under_review", "needs_review", "submitted"].includes(status?.toLowerCase())) {
    variant = "warning";
  } else if (["rejected", "cancelled", "suspended", "withdrawn"].includes(status?.toLowerCase())) {
    variant = "danger";
  } else if (["confirmed", "conditional_offer", "unconditional_offer", "visa_processing"].includes(status?.toLowerCase())) {
    variant = "indigo";
  }

  return (
    <Badge variant={variant} className="capitalize">
      {normalized}
    </Badge>
  );
}
