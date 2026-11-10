"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { appointmentsApi } from "@/lib/api/appointments";
import { AvailabilitySlot } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { formatDateTime } from "@/lib/utils";
import { Clock, Loader2, Plus } from "lucide-react";

export default function CounselorAvailabilityPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal: Add Slot
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  const loadSlots = async () => {
    setIsLoading(true);
    try {
      const res = await appointmentsApi.listAvailabilitySlots();
      setSlots(res.items || []);
    } catch (err) {
      console.error("Failed to load availability slots", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) return;
    setIsSaving(true);
    setSlotError(null);

    try {
      // Convert HTML datetime-local to ISO format
      const isoStart = new Date(startTime).toISOString();
      const isoEnd = new Date(endTime).toISOString();

      await appointmentsApi.addAvailabilitySlot({
        start_time: isoStart,
        end_time: isoEnd,
      });

      setIsModalOpen(false);
      setStartTime("");
      setEndTime("");
      setFeedback("Availability slot published! Students can now book this window.");
      await loadSlots();
    } catch (err: unknown) {
      setSlotError(err instanceof Error ? err.message : "Failed to add slot.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardShell allowedRoles={["counselor"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Availability Slots</h1>
            <p className="text-xs text-slate-500">
              Publish consultation windows when students can book 1-on-1 counseling sessions.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSlotError(null);
              setIsModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Publish Open Slot
          </Button>
        </div>

        {feedback && (
          <Alert variant="success" title="Availability Updated">
            {feedback}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : slots.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No availability slots published yet.</p>
            <p className="text-slate-500">Publish open time windows so students can schedule appointments.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.map((s) => (
              <Card key={s.id} className="p-4 space-y-2 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Consultation Window</span>
                  <Badge variant={s.is_booked ? "default" : "success"} size="sm">
                    {s.is_booked ? "Booked" : "Open for Booking"}
                  </Badge>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>
                    <strong>Start:</strong> {formatDateTime(s.start_time)}
                  </p>
                  <p>
                    <strong>End:</strong> {formatDateTime(s.end_time)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add Slot Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Publish Availability Slot"
          description="Specify start and end datetime for student bookings"
        >
          <form onSubmit={handleCreateSlot} className="space-y-4">
            {slotError && (
              <Alert variant="destructive" title="Validation Error">
                {slotError}
              </Alert>
            )}

            <Input
              label="Start Date & Time"
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />

            <Input
              label="End Date & Time"
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                Publish Slot
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}
