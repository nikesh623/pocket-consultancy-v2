"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { appointmentsApi } from "@/lib/api/appointments";
import { studentsApi } from "@/lib/api/students";
import { Appointment, AvailabilitySlot, User } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  FileText,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";

export default function CounselorDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCounselorData() {
      try {
        const [apptsRes, slotsRes, studentsRes] = await Promise.all([
          appointmentsApi.listAppointments({ limit: 10 }).catch(() => ({ items: [] })),
          appointmentsApi.listAvailabilitySlots().catch(() => ({ items: [] })),
          studentsApi.getAssignedStudents().catch(() => ({ items: [] })),
        ]);
        setAppointments(apptsRes.items || []);
        setSlots(slotsRes.items || []);
        setAssignedStudents(studentsRes.items || []);
      } catch (err) {
        console.error("Failed to load counselor dashboard", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCounselorData();
  }, []);

  const pendingAppointments = appointments.filter((a) => a.status === "scheduled");

  return (
    <DashboardShell allowedRoles={["counselor"]}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-0.5 text-xs font-semibold text-blue-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Counselor Advisory Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.full_name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Manage your consultation calendar, guide assigned students, review academic eligibility, and
              record private advisory notes.
            </p>
          </div>
        </div>

        {/* Quick Stat Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-600">
            <p className="text-xs text-slate-500 font-medium">Assigned Students</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{assignedStudents.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Under active guidance</p>
          </Card>

          <Card className="p-4 border-l-4 border-l-amber-500">
            <p className="text-xs text-slate-500 font-medium">Pending Appointments</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingAppointments.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting confirmation</p>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-600">
            <p className="text-xs text-slate-500 font-medium">Availability Windows</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{slots.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Published slots</p>
          </Card>
        </div>

        {/* Priority Section: Scheduled Consultations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Upcoming Consultations</CardTitle>
              <CardDescription>Appointments booked by students</CardDescription>
            </div>
            <Link href="/dashboard/counselor/appointments">
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600">
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No appointments booked yet.</p>
                <Link href="/dashboard/counselor/availability">
                  <Button variant="outline" size="sm">
                    Publish Availability Slots
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 4).map((apt) => (
                  <div
                    key={apt.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {formatDateTime(apt.scheduled_time)}
                        </span>
                        <StatusBadge status={apt.status} />
                      </div>
                      <p className="text-xs text-slate-600">
                        Duration: {apt.duration_minutes} Mins • Student: {apt.student_name || "Enrolled Student"}
                      </p>
                      {apt.student_notes && (
                        <p className="text-[11px] text-slate-500 italic">
                          Topic: &quot;{apt.student_notes}&quot;
                        </p>
                      )}
                    </div>

                    <Link href="/dashboard/counselor/appointments">
                      <Button variant="outline" size="sm" className="text-xs">
                        Manage Session
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Nav Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/counselor/availability">
            <Card className="p-4 hover:border-blue-400 hover:shadow-xs transition-all group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Manage Availability</h4>
                  <p className="text-[11px] text-slate-500">Publish open appointment slots</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/counselor/students">
            <Card className="p-4 hover:border-blue-400 hover:shadow-xs transition-all group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Assigned Students</h4>
                  <p className="text-[11px] text-slate-500">View profiles and academic interests</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/counselor/notes">
            <Card className="p-4 hover:border-blue-400 hover:shadow-xs transition-all group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Consultation Notes</h4>
                  <p className="text-[11px] text-slate-500">Record private advisory records</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
