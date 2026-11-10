"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { appointmentsApi } from "@/lib/api/appointments";
import { Appointment, AppointmentStatus } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { formatDateTime } from "@/lib/utils";
import { CalendarCheck, Loader2, XCircle } from "lucide-react";

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await appointmentsApi.listAppointments({
        status: statusFilter ? (statusFilter as AppointmentStatus) : undefined,
      });
      setAppointments(res.items || []);
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await appointmentsApi.cancelAppointment(id, "Administrative cancellation");
      setFeedback("Appointment has been cancelled.");
      await loadAppointments();
    } catch (err) {
      console.error("Failed to cancel", err);
    }
  };

  return (
    <DashboardShell allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointment Oversight</h1>
            <p className="text-xs text-slate-500">
              Audit and supervise all counseling bookings across students and advisors.
            </p>
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "", label: "All Appointment Statuses" },
                { value: "scheduled", label: "Scheduled" },
                { value: "confirmed", label: "Confirmed" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </div>
        </div>

        {feedback && (
          <Alert variant="info" title="Status Notice">
            {feedback}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : appointments.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-400 space-y-2">
            <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No appointments found matching current filter.</p>
          </Card>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Scheduled Time</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Student Notes</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{formatDateTime(a.scheduled_time)}</td>
                    <td className="p-3.5 text-slate-600">{a.duration_minutes} Mins</td>
                    <td className="p-3.5 text-slate-500 max-w-xs truncate">{a.student_notes || "—"}</td>
                    <td className="p-3.5">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="p-3.5 text-right">
                      {["scheduled", "confirmed"].includes(a.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 text-[11px]"
                          onClick={() => handleCancel(a.id)}
                          icon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
