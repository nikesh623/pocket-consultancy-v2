import { apiClient } from "./client";
import {
  Appointment,
  AppointmentListResponse,
  AppointmentStatus,
  AvailabilitySlot,
} from "@/types/api";

export const appointmentsApi = {
  listAppointments: async (params?: {
    counselor_id?: string;
    student_id?: string;
    status?: AppointmentStatus;
    skip?: number;
    limit?: number;
  }): Promise<AppointmentListResponse> => {
    const query = new URLSearchParams();
    if (params?.counselor_id) query.set("counselor_id", params.counselor_id);
    if (params?.student_id) query.set("student_id", params.student_id);
    if (params?.status) query.set("status", params.status);
    if (params?.skip) query.set("skip", params.skip.toString());
    if (params?.limit) query.set("limit", params.limit.toString());

    return apiClient<AppointmentListResponse>(`/api/v1/appointments/?${query.toString()}`);
  },

  listAvailabilitySlots: async (counselorId?: string): Promise<{ items: AvailabilitySlot[]; total: number }> => {
    const query = new URLSearchParams();
    if (counselorId) query.set("counselor_id", counselorId);
    return apiClient<{ items: AvailabilitySlot[]; total: number }>(
      `/api/v1/appointments/availability?${query.toString()}`
    );
  },

  addAvailabilitySlot: async (payload: {
    start_time: string;
    end_time: string;
  }): Promise<AvailabilitySlot> => {
    return apiClient<AvailabilitySlot>("/api/v1/appointments/availability", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  bookAppointment: async (payload: {
    counselor_id: string;
    scheduled_time: string;
    duration_minutes?: number;
    student_notes?: string;
  }): Promise<Appointment> => {
    return apiClient<Appointment>("/api/v1/appointments/book", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  cancelAppointment: async (appointmentId: string, reason?: string): Promise<Appointment> => {
    return apiClient<Appointment>(`/api/v1/appointments/${appointmentId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "Cancelled by user" }),
    });
  },

  updateAppointmentStatus: async (
    appointmentId: string,
    status: AppointmentStatus,
    counselorNotes?: string
  ): Promise<Appointment> => {
    return apiClient<Appointment>(`/api/v1/appointments/${appointmentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, counselor_notes: counselorNotes }),
    });
  },
};
