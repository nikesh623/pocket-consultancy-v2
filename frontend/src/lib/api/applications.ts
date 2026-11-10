import { apiClient } from "./client";
import {
  Application,
  ApplicationDetailResponse,
  ApplicationListResponse,
  ApplicationStatus,
} from "@/types/api";

export const applicationsApi = {
  submitApplication: async (payload: {
    course_id: string;
    university_id: string;
    intake_period: string;
  }): Promise<Application> => {
    return apiClient<Application>("/api/v1/applications/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  listApplications: async (params?: {
    student_id?: string;
    status?: ApplicationStatus;
    page?: number;
    size?: number;
  }): Promise<ApplicationListResponse> => {
    const query = new URLSearchParams();
    if (params?.student_id) query.set("student_id", params.student_id);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.size) query.set("size", params.size.toString());

    return apiClient<ApplicationListResponse>(`/api/v1/applications/?${query.toString()}`);
  },

  getApplicationDetail: async (applicationId: string): Promise<ApplicationDetailResponse> => {
    return apiClient<ApplicationDetailResponse>(`/api/v1/applications/${applicationId}`);
  },

  transitionStatus: async (
    applicationId: string,
    targetStatus: ApplicationStatus,
    remarks?: string
  ): Promise<ApplicationDetailResponse> => {
    return apiClient<ApplicationDetailResponse>(
      `/api/v1/applications/${applicationId}/transition`,
      {
        method: "POST",
        body: JSON.stringify({
          target_status: targetStatus,
          remarks: remarks || "Status updated",
        }),
      }
    );
  },
};
