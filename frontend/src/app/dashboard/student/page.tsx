"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { studentsApi } from "@/lib/api/students";
import { applicationsApi } from "@/lib/api/applications";
import { appointmentsApi } from "@/lib/api/appointments";
import { documentsApi } from "@/lib/api/documents";
import { Application, Appointment, DocumentItem, StudentProfile } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileCheck2,
  GraduationCap,
  Layers,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStudentData() {
      try {
        const [prof, apps, appts, docs] = await Promise.all([
          studentsApi.getOwnProfile().catch(() => null),
          applicationsApi.listApplications({ size: 5 }).catch(() => ({ items: [] })),
          appointmentsApi.listAppointments({ limit: 5 }).catch(() => ({ items: [] })),
          documentsApi.listDocuments({ limit: 5 }).catch(() => ({ items: [] })),
        ]);
        setProfile(prof);
        setApplications(apps.items || []);
        setAppointments(appts.items || []);
        setDocuments(docs.items || []);
      } catch (err) {
        console.error("Failed to load student dashboard", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudentData();
  }, []);

  const isProfileComplete = !!(profile?.highest_qualification && profile?.academic_score);

  return (
    <DashboardShell allowedRoles={["student"]}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-0.5 text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.full_name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Track your educational consultancy journey, match with degree programs, book counselor
              sessions, and monitor your university applications.
            </p>
          </div>
        </div>

        {/* Profile Completion Alert Banner if needed */}
        {!isProfileComplete && !isLoading && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900">Academic Profile Incomplete</h4>
                <p className="text-[11px] text-amber-700">
                  Provide your GPA, qualifications, and budget to enable rule-based course recommendations.
                </p>
              </div>
            </div>
            <Link href="/dashboard/student/profile">
              <Button variant="primary" size="sm" className="whitespace-nowrap">
                Complete Profile
              </Button>
            </Link>
          </div>
        )}

        {/* Quick Stat Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Applications</p>
              <p className="text-lg font-bold text-slate-900">{applications.length}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Appointments</p>
              <p className="text-lg font-bold text-slate-900">{appointments.length}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Documents</p>
              <p className="text-lg font-bold text-slate-900">{documents.length}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Assigned Advisor</p>
              <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                {profile?.assigned_counselor_name || "Pending Assignment"}
              </p>
            </div>
          </Card>
        </div>

        {/* Main Grid: Active Applications & Upcoming Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications Widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>My Applications</CardTitle>
                <CardDescription>Track status transitions and audit history</CardDescription>
              </div>
              <Link href="/dashboard/student/applications">
                <Button variant="ghost" size="sm" className="text-indigo-600 text-xs">
                  View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                  <TrendingUp className="w-8 h-8 mx-auto text-slate-300" />
                  <p>No applications submitted yet.</p>
                  <Link href="/dashboard/student/matches">
                    <Button variant="outline" size="sm">
                      Discover Matches & Apply
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 3).map((app) => (
                    <div
                      key={app.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {app.reference_number}
                          </span>
                          <StatusBadge status={app.status} />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Intake: {app.intake_period} • Submitted: {formatDate(app.created_at)}
                        </p>
                      </div>
                      <Link href="/dashboard/student/applications">
                        <Button variant="outline" size="sm" className="text-xs">
                          Details
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointments Widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Counseling Sessions</CardTitle>
                <CardDescription>Upcoming 1-on-1 advisor consultations</CardDescription>
              </div>
              <Link href="/dashboard/student/appointments">
                <Button variant="ghost" size="sm" className="text-indigo-600 text-xs">
                  Book Session <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                  <CalendarCheck className="w-8 h-8 mx-auto text-slate-300" />
                  <p>No appointments scheduled.</p>
                  <Link href="/dashboard/student/appointments">
                    <Button variant="outline" size="sm">
                      Book an Advisor
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">
                            {formatDateTime(apt.scheduled_time)}
                          </span>
                          <StatusBadge status={apt.status} />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Duration: {apt.duration_minutes} mins • Advisor: {apt.counselor_name || "Assigned Counselor"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <Link href="/dashboard/student/matches">
            <Card className="p-4 hover:border-indigo-400 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Run Course Matching</h4>
                  <p className="text-[11px] text-slate-500">Evaluate criteria against academic eligibility</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/student/documents">
            <Card className="p-4 hover:border-indigo-400 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Submit Documents</h4>
                  <p className="text-[11px] text-slate-500">Upload transcripts & verify reviewer status</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/student/shortlist">
            <Card className="p-4 hover:border-indigo-400 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Course Shortlist</h4>
                  <p className="text-[11px] text-slate-500">Review saved programs before submission</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
