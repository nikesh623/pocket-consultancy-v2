"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CalendarCheck,
  CheckSquare,
  Clock,
  Compass,
  FileCheck2,
  FileText,
  Globe2,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

export function DashboardSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  // Navigation configurations based strictly on backend capabilities
  const getNavItems = () => {
    switch (role) {
      case "admin":
        return [
          { href: "/dashboard/admin", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
          { href: "/dashboard/admin/users", label: "User Management", icon: <Users className="w-4 h-4" /> },
          { href: "/dashboard/admin/destinations", label: "Destinations & Universities", icon: <Globe2 className="w-4 h-4" /> },
          { href: "/dashboard/admin/courses", label: "Course Catalog", icon: <BookOpen className="w-4 h-4" /> },
          { href: "/dashboard/admin/appointments", label: "Appointment Oversight", icon: <CalendarCheck className="w-4 h-4" /> },
          { href: "/dashboard/admin/applications", label: "Application Tracking", icon: <TrendingUp className="w-4 h-4" /> },
          { href: "/dashboard/admin/documents", label: "Document Audits", icon: <FileCheck2 className="w-4 h-4" /> },
        ];
      case "counselor":
        return [
          { href: "/dashboard/counselor", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
          { href: "/dashboard/counselor/availability", label: "Availability Slots", icon: <Clock className="w-4 h-4" /> },
          { href: "/dashboard/counselor/appointments", label: "My Appointments", icon: <CalendarCheck className="w-4 h-4" /> },
          { href: "/dashboard/counselor/students", label: "Assigned Students", icon: <Users className="w-4 h-4" /> },
          { href: "/dashboard/counselor/notes", label: "Consultation Notes", icon: <FileText className="w-4 h-4" /> },
        ];
      case "documentation_officer":
        return [
          { href: "/dashboard/documentation", label: "Review Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
          { href: "/dashboard/documentation/queue", label: "Verification Queue", icon: <CheckSquare className="w-4 h-4" /> },
        ];
      case "student":
      default:
        return [
          { href: "/dashboard/student", label: "Home", icon: <LayoutDashboard className="w-4 h-4" /> },
          { href: "/dashboard/student/profile", label: "Academic Profile", icon: <GraduationCap className="w-4 h-4" /> },
          { href: "/dashboard/student/matches", label: "Course Recommendations", icon: <Sparkles className="w-4 h-4" /> },
          { href: "/dashboard/student/shortlist", label: "Shortlisted Courses", icon: <Layers className="w-4 h-4" /> },
          { href: "/dashboard/student/appointments", label: "Counseling Sessions", icon: <CalendarCheck className="w-4 h-4" /> },
          { href: "/dashboard/student/documents", label: "Document Center", icon: <FileCheck2 className="w-4 h-4" /> },
          { href: "/dashboard/student/applications", label: "My Applications", icon: <TrendingUp className="w-4 h-4" /> },
        ];
    }
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
    switch (role) {
      case "admin":
        return { label: "Administrator", color: "bg-purple-100 text-purple-700 border-purple-200" };
      case "counselor":
        return { label: "Counselor", color: "bg-blue-100 text-blue-700 border-blue-200" };
      case "documentation_officer":
        return { label: "Doc Officer", color: "bg-amber-100 text-amber-700 border-amber-200" };
      case "student":
      default:
        return { label: "Student", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    }
  };

  const badge = getRoleBadge();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header / Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 leading-tight">Pocket Consultancy</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                Workspace V2
              </span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.full_name || "Authenticated User"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                badge.color
              )}
            >
              {badge.label}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span className={cn(isActive ? "text-indigo-600" : "text-slate-400")}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom footer: Sign out */}
        <div className="border-t border-slate-200 p-3">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
