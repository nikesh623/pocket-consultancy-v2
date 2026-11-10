"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { DashboardSidebar } from "./sidebar";
import { DashboardTopbar } from "./topbar";
import { UserRole } from "@/types/api";
import { Loader2 } from "lucide-react";

export function DashboardShell({
  allowedRoles,
  children,
}: {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}) {
  const { user, role, isLoading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (allowedRoles && role && !allowedRoles.includes(role)) {
        // Redirect to their actual role dashboard if trying to access unauthorized area
        switch (role) {
          case "admin":
            router.push("/dashboard/admin");
            break;
          case "counselor":
            router.push("/dashboard/counselor");
            break;
          case "documentation_officer":
            router.push("/dashboard/documentation");
            break;
          case "student":
          default:
            router.push("/dashboard/student");
            break;
        }
      }
    }
  }, [isLoading, isAuthenticated, role, allowedRoles, router]);

  if (isLoading || !isAuthenticated || (allowedRoles && role && !allowedRoles.includes(role))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">Loading authorized workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
