"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { usersApi } from "@/lib/api/users";
import { applicationsApi } from "@/lib/api/applications";
import { documentsApi } from "@/lib/api/documents";
import { appointmentsApi } from "@/lib/api/appointments";
import { coursesApi } from "@/lib/api/courses";
import { User } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    studentsCount: 0,
    pendingApprovals: 0,
    counselorsCount: 0,
    officersCount: 0,
    applicationsCount: 0,
    documentsCount: 0,
    coursesCount: 0,
  });

  const [pendingStudents, setPendingStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadAdminMetrics = async () => {
    setIsLoading(true);
    try {
      const [allUsersRes, pendingRes, counselorsRes, officersRes, appsRes, docsRes, coursesRes] =
        await Promise.all([
          usersApi.listUsers({ size: 100 }).catch(() => ({ items: [], total: 0 })),
          usersApi.listUsers({ role: "student", account_status: "pending" }).catch(() => ({ items: [], total: 0 })),
          usersApi.listUsers({ role: "counselor" }).catch(() => ({ items: [], total: 0 })),
          usersApi.listUsers({ role: "documentation_officer" }).catch(() => ({ items: [], total: 0 })),
          applicationsApi.listApplications().catch(() => ({ items: [], total: 0 })),
          documentsApi.listDocuments().catch(() => ({ items: [], total: 0 })),
          coursesApi.listCourses().catch(() => ({ items: [], total: 0 })),
        ]);

      const students = (allUsersRes.items || []).filter((u) => u.role === "student");

      setMetrics({
        totalUsers: allUsersRes.total,
        studentsCount: students.length,
        pendingApprovals: pendingRes.total,
        counselorsCount: counselorsRes.total,
        officersCount: officersRes.total,
        applicationsCount: appsRes.total,
        documentsCount: docsRes.total,
        coursesCount: coursesRes.total,
      });

      setPendingStudents(pendingRes.items || []);
    } catch (err) {
      console.error("Failed to load admin metrics", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminMetrics();
  }, []);

  const handleApprove = async (userId: string, email: string) => {
    try {
      await usersApi.updateUserStatus(userId, "active");
      setActionFeedback(`Account for ${email} approved! The student can now sign in.`);
      await loadAdminMetrics();
    } catch (err) {
      console.error("Failed to approve user", err);
    }
  };

  const handleReject = async (userId: string, email: string) => {
    const reason = prompt("Enter optional reason for rejecting this student registration:") || undefined;
    try {
      await usersApi.updateUserStatus(userId, "rejected", reason);
      setActionFeedback(`Account for ${email} marked as rejected.`);
      await loadAdminMetrics();
    } catch (err) {
      console.error("Failed to reject user", err);
    }
  };

  return (
    <DashboardShell allowedRoles={["admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-0.5 text-xs font-semibold text-purple-700 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrator Oversight Console</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Administration & Analytics</h1>
            <p className="text-xs text-slate-500">
              Manage student registrations, staff assignments, institutional catalogs, and platform auditing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/admin/users">
              <Button variant="primary" size="sm" icon={<UserPlus className="w-4 h-4" />}>
                Create Staff Account
              </Button>
            </Link>
          </div>
        </div>

        {actionFeedback && (
          <Alert variant="success" title="Administrative Action Executed">
            {actionFeedback}
          </Alert>
        )}

        {/* Real Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-purple-600">
            <p className="text-xs text-slate-500 font-medium">Total System Users</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalUsers}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{metrics.studentsCount} Students</p>
          </Card>

          <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/10">
            <p className="text-xs text-amber-800 font-semibold">Pending Approvals</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{metrics.pendingApprovals}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting admin review</p>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-600">
            <p className="text-xs text-slate-500 font-medium">Active Counselors</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{metrics.counselorsCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{metrics.officersCount} Doc Officers</p>
          </Card>

          <Card className="p-4 border-l-4 border-l-indigo-600">
            <p className="text-xs text-slate-500 font-medium">Applications Filed</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{metrics.applicationsCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{metrics.coursesCount} Catalog Courses</p>
          </Card>
        </div>

        {/* Priority Section: Student Approval Queue */}
        <Card className="border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3 bg-amber-50/30 rounded-t-xl border-b border-amber-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <CardTitle className="text-sm text-amber-950">Student Registration Approval Queue</CardTitle>
              </div>
              <CardDescription className="text-xs text-amber-700">
                Newly registered student accounts remain in pending state until explicitly activated by an admin.
              </CardDescription>
            </div>
            <Link href="/dashboard/admin/users">
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600">
                Manage All Users <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : pendingStudents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-semibold text-slate-700">Queue is clear!</p>
                <p>No student accounts currently awaiting administrator verification.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingStudents.map((u) => (
                  <div key={u.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{u.full_name}</span>
                        <StatusBadge status={u.account_status} />
                      </div>
                      <p className="text-xs text-slate-500">
                        {u.email} • Registered on {formatDate(u.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleApprove(u.id, u.email)}
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Approve & Activate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => handleReject(u.id, u.email)}
                        icon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Management Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/admin/users">
            <Card className="p-4 hover:border-indigo-400 hover:shadow-xs transition-all group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">User Management</h4>
                  <p className="text-[11px] text-slate-500">Manage accounts, counselors, and staff</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/admin/destinations">
            <Card className="p-4 hover:border-indigo-400 hover:shadow-xs transition-all group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Destinations & Universities</h4>
                  <p className="text-[11px] text-slate-500">Create study countries and colleges</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/admin/courses">
            <Card className="p-4 hover:border-indigo-400 hover:shadow-xs transition-all group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Course Catalog</h4>
                  <p className="text-[11px] text-slate-500">Add degree programs, fees & entry scores</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
