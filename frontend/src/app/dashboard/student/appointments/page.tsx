"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { appointmentsApi } from "@/lib/api/appointments";
import { usersApi } from "@/lib/api/users";
import { Appointment, AvailabilitySlot, User } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { formatDateTime } from "@/lib/utils";
import {
  Calendar,
  CalendarCheck,
  Clock,
  Loader2,
  Plus,
  UserCheck,
  XCircle,
} from "lucide-react";

export default function StudentAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [counselors, setCounselors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Booking Modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [studentNotes, setStudentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [apptsRes, slotsRes, counselorsRes] = await Promise.all([
        appointmentsApi.listAppointments(),
        appointmentsApi.listAvailabilitySlots(),
        usersApi.listUsers({ role: "counselor" }),
      ]);
      setAppointments(apptsRes.items || []);
      setAvailableSlots((slotsRes.items || []).filter((s) => !s.is_booked));
      setCounselors(counselorsRes.items || []);
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setIsSubmitting(true);
    setBookError(null);

    try {
      await appointmentsApi.bookAppointment({
        counselor_id: selectedSlot.counselor_id,
        scheduled_time: selectedSlot.start_time,
        duration_minutes: 45,
        student_notes: studentNotes,
      });

      setIsBookModalOpen(false);
      setStudentNotes("");
      setFeedback("Appointment successfully booked! Your counselor has been notified.");
      await loadData();
    } catch (err: unknown) {
      setBookError(err instanceof Error ? err.message : "Failed to book appointment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this counseling appointment?")) return;
    try {
      await appointmentsApi.cancelAppointment(appointmentId, "Cancelled by student request");
      setFeedback("Appointment cancelled successfully.");
      await loadData();
    } catch (err) {
      console.error("Failed to cancel appointment", err);
    }
  };

  const getCounselorName = (counselorId: string) => {
    const counselor = counselors.find((c) => c.id === counselorId);
    return counselor?.full_name || "Verified Counselor";
  };

  return (
    <DashboardShell allowedRoles={["student"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Counseling Appointments</h1>
            <p className="text-xs text-slate-500">
              Schedule 1-on-1 consultations with international academic advisors.
            </p>
          </div>
        </div>

        {feedback && (
          <Alert variant="info" title="Appointment Status">
            {feedback}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Scheduled Appointments (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
              <span>Your Scheduled Appointments</span>
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : appointments.length === 0 ? (
              <Card className="p-8 text-center text-xs text-slate-400 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                <p>You have no active appointments booked.</p>
                <p className="text-slate-500">Select an available time slot from the right to book your session.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <Card key={apt.id} className="p-4 hover:border-slate-300 transition-colors">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {formatDateTime(apt.scheduled_time)}
                          </span>
                          <StatusBadge status={apt.status} />
                        </div>
                        <p className="text-xs text-slate-600">
                          Advisor: <strong className="text-slate-800">{getCounselorName(apt.counselor_id)}</strong> •{" "}
                          Duration: {apt.duration_minutes} Minutes
                        </p>
                        {apt.student_notes && (
                          <p className="text-[11px] text-slate-500 italic">
                            Your Notes: &quot;{apt.student_notes}&quot;
                          </p>
                        )}
                      </div>

                      {apt.status === "scheduled" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50 text-xs"
                          onClick={() => handleCancel(apt.id)}
                          icon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Open Availability Slots (1 Col) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Available Counselor Slots</span>
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : availableSlots.length === 0 ? (
              <Card className="p-6 text-center text-xs text-slate-400 space-y-1">
                <Clock className="w-6 h-6 mx-auto text-slate-300" />
                <p>No open availability slots found.</p>
                <p className="text-[11px] text-slate-500">Your counselor will publish upcoming consultation windows shortly.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {availableSlots.map((slot) => (
                  <Card key={slot.id} className="p-3 bg-white hover:border-indigo-400 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {formatDateTime(slot.start_time)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {getCounselorName(slot.counselor_id)}
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setIsBookModalOpen(true);
                        }}
                        icon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Book
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Dialog */}
        <Modal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          title="Confirm Counseling Consultation"
          description="Schedule a 1-on-1 virtual counseling session"
        >
          {selectedSlot && (
            <form onSubmit={handleBook} className="space-y-4">
              {bookError && (
                <Alert variant="destructive" title="Booking Error">
                  {bookError}
                </Alert>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1 text-xs">
                <p>
                  <strong>Advisor:</strong> {getCounselorName(selectedSlot.counselor_id)}
                </p>
                <p>
                  <strong>Scheduled Time:</strong> {formatDateTime(selectedSlot.start_time)}
                </p>
                <p>
                  <strong>Standard Duration:</strong> 45 Minutes
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Consultation Topics / Student Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Inquiring about scholarship eligibility for Stanford MSc Computer Science..."
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsBookModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  icon={<CalendarCheck className="w-3.5 h-3.5" />}
                >
                  Confirm Booking
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </DashboardShell>
  );
}
