import { apiClient, downloadFileBlob } from "./client";
import {
  DocumentCategory,
  DocumentItem,
  DocumentListResponse,
  DocumentStatus,
} from "@/types/api";

export const documentsApi = {
  listDocuments: async (params?: {
    student_id?: string;
    status?: DocumentStatus;
    skip?: number;
    limit?: number;
  }): Promise<DocumentListResponse> => {
    const query = new URLSearchParams();
    if (params?.student_id) query.set("student_id", params.student_id);
    if (params?.status) query.set("status", params.status);
    if (params?.skip) query.set("skip", params.skip.toString());
    if (params?.limit) query.set("limit", params.limit.toString());

    return apiClient<DocumentListResponse>(`/api/v1/documents/?${query.toString()}`);
  },

  uploadDocument: async (file: File, category: DocumentCategory): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append("category", category);
    formData.append("file", file);

    return apiClient<DocumentItem>("/api/v1/documents/upload", {
      method: "POST",
      body: formData,
    });
  },

  reviewDocument: async (
    documentId: string,
    status: DocumentStatus,
    comments?: string
  ): Promise<DocumentItem> => {
    return apiClient<DocumentItem>(`/api/v1/documents/${documentId}/review`, {
      method: "POST",
      body: JSON.stringify({ status, comments }),
    });
  },

  downloadDocument: async (documentId: string): Promise<Blob> => {
    return downloadFileBlob(`/api/v1/documents/${documentId}/download`);
  },
};
