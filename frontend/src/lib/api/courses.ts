import { apiClient } from "./client";
import { Course, CourseListResponse, StudyLevel } from "@/types/api";

export const coursesApi = {
  listCourses: async (params?: {
    university_id?: string;
    country_id?: string;
    study_level?: StudyLevel;
    max_fee?: number;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<CourseListResponse> => {
    const query = new URLSearchParams();
    if (params?.university_id) query.set("university_id", params.university_id);
    if (params?.country_id) query.set("country_id", params.country_id);
    if (params?.study_level) query.set("study_level", params.study_level);
    if (params?.max_fee) query.set("max_fee", params.max_fee.toString());
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.size) query.set("size", params.size.toString());

    return apiClient<CourseListResponse>(`/api/v1/courses/?${query.toString()}`);
  },

  getCourse: async (courseId: string): Promise<Course> => {
    return apiClient<Course>(`/api/v1/courses/${courseId}`);
  },

  createCourse: async (payload: {
    name: string;
    university_id: string;
    country_id: string;
    study_level: StudyLevel;
    duration_months: number;
    tuition_fee: number;
    currency: string;
    min_academic_score?: number | null;
    entry_requirements?: string | null;
    description?: string | null;
    is_active?: boolean;
  }): Promise<Course> => {
    return apiClient<Course>("/api/v1/courses/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateCourse: async (
    courseId: string,
    payload: Partial<{
      name: string;
      university_id: string;
      country_id: string;
      study_level: StudyLevel;
      duration_months: number;
      tuition_fee: number;
      currency: string;
      min_academic_score: number | null;
      entry_requirements: string;
      description: string;
      is_active: boolean;
    }>
  ): Promise<Course> => {
    return apiClient<Course>(`/api/v1/courses/${courseId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
