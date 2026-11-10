import { apiClient } from "./client";
import {
  CourseMatchResponse,
  CounselorNote,
  CounselorNoteListResponse,
  ShortlistListResponse,
  ShortlistResponse,
  StudentProfile,
  User,
} from "@/types/api";

export const studentsApi = {
  getOwnProfile: async (): Promise<StudentProfile> => {
    return apiClient<StudentProfile>("/api/v1/students/me/profile");
  },

  upsertOwnProfile: async (payload: Partial<StudentProfile>): Promise<StudentProfile> => {
    return apiClient<StudentProfile>("/api/v1/students/me/profile", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateOwnProfile: async (payload: Partial<StudentProfile>): Promise<StudentProfile> => {
    return apiClient<StudentProfile>("/api/v1/students/me/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  getStudentProfileById: async (userId: string): Promise<StudentProfile> => {
    return apiClient<StudentProfile>(`/api/v1/students/${userId}/profile`);
  },

  getMatches: async (): Promise<CourseMatchResponse> => {
    return apiClient<CourseMatchResponse>("/api/v1/students/me/matches");
  },

  // Shortlist
  getShortlist: async (): Promise<ShortlistListResponse> => {
    return apiClient<ShortlistListResponse>("/api/v1/students/me/shortlist");
  },

  addToShortlist: async (courseId: string): Promise<ShortlistResponse> => {
    return apiClient<ShortlistResponse>("/api/v1/students/me/shortlist", {
      method: "POST",
      body: JSON.stringify({ course_id: courseId }),
    });
  },

  removeFromShortlist: async (courseId: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/api/v1/students/me/shortlist/${courseId}`, {
      method: "DELETE",
    });
  },

  // Counselor Specific
  getAssignedStudents: async (): Promise<{ items: User[]; total: number }> => {
    return apiClient<{ items: User[]; total: number }>(
      "/api/v1/students/counselor/assigned-students"
    );
  },

  addCounselorNote: async (studentId: string, noteContent: string): Promise<CounselorNote> => {
    return apiClient<CounselorNote>("/api/v1/students/counselor/notes", {
      method: "POST",
      body: JSON.stringify({ student_id: studentId, note_content: noteContent }),
    });
  },

  getCounselorNotes: async (studentId: string): Promise<CounselorNoteListResponse> => {
    return apiClient<CounselorNoteListResponse>(
      `/api/v1/students/counselor/notes/${studentId}`
    );
  },

  // Admin Specific
  assignCounselor: async (studentId: string, counselorId: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>("/api/v1/students/assign-counselor", {
      method: "POST",
      body: JSON.stringify({ student_id: studentId, counselor_id: counselorId }),
    });
  },
};
