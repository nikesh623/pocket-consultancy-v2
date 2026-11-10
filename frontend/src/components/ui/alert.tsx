import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "destructive";
  title?: string;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: AlertProps) {
  const variants = {
    info: {
      container: "bg-sky-50 border-sky-200 text-sky-900",
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
    },
    success: {
      container: "bg-emerald-50 border-emerald-200 text-emerald-900",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    warning: {
      container: "bg-amber-50 border-amber-200 text-amber-900",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    destructive: {
      container: "bg-rose-50 border-rose-200 text-rose-900",
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    },
  };

  const selected = variants[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-xl border p-4 text-sm leading-relaxed",
        selected.container,
        className
      )}
      {...props}
    >
      {selected.icon}
      <div className="space-y-1">
        {title && <h5 className="font-semibold">{title}</h5>}
        <div className="text-xs sm:text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}
