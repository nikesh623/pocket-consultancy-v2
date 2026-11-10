"use client";

import React, { useEffect, useRef, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { documentsApi } from "@/lib/api/documents";
import { DocumentCategory, DocumentItem } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { formatDate, formatFileSize } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";

export default function StudentDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>("academic_transcript");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await documentsApi.listDocuments();
      setDocuments(res.items || []);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setFeedback(null);

    // Client-side Validation (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds maximum allowed limit of 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const allowedMime = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedMime.includes(file.type)) {
      setUploadError("Invalid file type. Only PDF, JPG, and PNG documents are permitted.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      await documentsApi.uploadDocument(file, selectedCategory);
      setFeedback(`"${file.name}" uploaded successfully! Submitted for officer review.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDocuments();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (docId: string, filename: string) => {
    try {
      const blob = await documentsApi.downloadDocument(docId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download file", err);
    }
  };

  return (
    <DashboardShell allowedRoles={["student"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Document Verification Center</h1>
          <p className="text-xs text-slate-500">
            Submit required academic credentials, identity proofs, and test reports for documentation officer review.
          </p>
        </div>

        {uploadError && (
          <Alert variant="destructive" title="Upload Validation Error">
            {uploadError}
          </Alert>
        )}

        {feedback && (
          <Alert variant="success" title="Document Uploaded">
            {feedback}
          </Alert>
        )}

        {/* Upload Card */}
        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Upload Required Document</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Accepted formats: PDF, JPG, JPEG, PNG (Strict 5MB limit with magic-byte inspection).
                </p>
              </div>

              <div className="w-full sm:w-64">
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
                  options={[
                    { value: "academic_transcript", label: "Academic Transcript" },
                    { value: "passport", label: "Passport / Government ID" },
                    { value: "english_test", label: "English Language Test (IELTS/TOEFL)" },
                    { value: "recommendation_letter", label: "Letter of Recommendation" },
                    { value: "statement_of_purpose", label: "Statement of Purpose (SOP)" },
                    { value: "financial_proof", label: "Financial / Bank Statement" },
                    { value: "other", label: "Other Supporting Document" },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center justify-center border-2 border-dashed border-indigo-200 rounded-xl p-6 bg-white hover:border-indigo-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                id="doc-upload"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <label
                htmlFor="doc-upload"
                className="flex flex-col items-center gap-2 cursor-pointer text-center"
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                ) : (
                  <FileText className="w-8 h-8 text-indigo-500" />
                )}
                <div className="text-xs">
                  <span className="font-semibold text-indigo-600 hover:text-indigo-700">Click to choose file</span>{" "}
                  <span className="text-slate-500">or drag and drop document</span>
                </div>
                <span className="text-[10px] text-slate-400">PDF, JPG, JPEG, PNG up to 5MB</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Documents List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            <span>Uploaded Documents & Verification Status</span>
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : documents.length === 0 ? (
            <Card className="p-8 text-center text-xs text-slate-400 space-y-1">
              <FileCheck2 className="w-8 h-8 mx-auto text-slate-300" />
              <p>No documents uploaded yet.</p>
              <p className="text-slate-500">Upload your academic transcripts and identity documents above.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="p-4 hover:border-slate-300 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{doc.original_filename}</span>
                        <StatusBadge status={doc.status} />
                      </div>
                      <p className="text-xs text-slate-500">
                        Category: <strong className="text-slate-700 capitalize">{doc.category.replace(/_/g, " ")}</strong> • Size:{" "}
                        {formatFileSize(doc.file_size_bytes)} • Uploaded on {formatDate(doc.created_at)}
                      </p>

                      {/* Reviewer Feedback Banner */}
                      {doc.review_comments && (
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700 space-y-0.5 mt-2">
                          <span className="font-semibold text-slate-900">Officer Feedback:</span>
                          <p className="text-slate-600">{doc.review_comments}</p>
                          {doc.reviewed_at && (
                            <span className="text-[10px] text-slate-400">Reviewed on {formatDate(doc.reviewed_at)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleDownload(doc.id, doc.original_filename)}
                        icon={<Download className="w-3.5 h-3.5" />}
                      >
                        Download File
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
