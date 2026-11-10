"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { appointmentsApi } from "@/lib/api/appointments";
import { Appointment, AppointmentStatus } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { formatDateTime } from "@/lib/utils";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";

export default function CounselorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Status Update Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<AppointmentStatus>("confirmed");
  const [counselorNotes, setCounselorNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await appointmentsApi.listAppointments({
        status: statusFilter ? (statusFilter as AppointmentStatus) : undefined,
      });
      setAppointments(res.items || []);
    } catch (err) {
      console.error("Failed to load counselor appointments", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const handleOpenStatusModal = (apt: Appointment, target: AppointmentStatus) => {
    setSelectedAppt(apt);
    setNewStatus(target);
    setCounselorNotes(apt.counselor_notes || "");
    setIsModalOpen(true);
  };

  const handleConfirmStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setIsUpdating(true);

    try {
      await appointmentsApi.updateAppointmentStatus(
        selectedAppt.id,
        newStatus,
        counselorNotes || undefined
      );

      setIsModalOpen(false);
      setFeedback(`Appointment marked as "${newStatus}".`);
      await loadAppointments();
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await appointmentsApi.cancelAppointment(id, "Cancelled by counselor");
      setFeedback("Appointment marked as cancelled.");
      await loadAppointments();
    } catch (err) {
      console.error("Failed to cancel", err);
    }
  };

  return (
    <DashboardShell allowedRoles={["counselor"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Consultation Sessions</h1>
            <p className="text-xs text-slate-500">
              Confirm upcoming sessions, complete consultations, and record official counselor feedback.
            </p>
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "", label: "All Appointment Statuses" },
                { value: "scheduled", label: "Scheduled (Pending)" },
                { value: "confirmed", label: "Confirmed" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </div>
        </div>

        {feedback && (
          <Alert variant="success" title="Session Updated">
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
            <p>No appointments match the selected criteria.</p>
          </Card>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Session Time</th>
                  <th className="p-3.5">Student Notes</th>
                  <th className="p-3.5">Counselor Notes</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{formatDateTime(a.scheduled_time)}</div>
                      <div className="text-slate-500 text-[11px]">{a.duration_minutes} Mins</div>
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">{a.student_notes || "—"}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">{a.counselor_notes || "—"}</td>
                    <td className="p-3.5">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      {a.status === "scheduled" && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-[11px] bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleOpenStatusModal(a, "confirmed")}
                        >
                          Confirm
                        </Button>
                      )}

                      {a.status === "confirmed" && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-[11px] bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleOpenStatusModal(a, "completed")}
                        >
                          Complete
                        </Button>
                      )}

                      {["scheduled", "confirmed"].includes(a.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[11px] text-rose-600 hover:bg-rose-50"
                          onClick={() => handleCancel(a.id)}
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

        {/* Status Update Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Update Session Status: ${newStatus}`}
          description="Record session completion and private advisory notes"
        >
          <form onSubmit={handleConfirmStatus} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Session Counselor Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Recommended student apply for University of Toronto with current 82% GPA..."
                value={counselorNotes}
                onChange={(e) => setCounselorNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isUpdating}>
                Save Status
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}
