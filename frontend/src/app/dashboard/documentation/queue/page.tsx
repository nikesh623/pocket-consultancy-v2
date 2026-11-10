"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { documentsApi } from "@/lib/api/documents";
import { DocumentCategory, DocumentItem, DocumentStatus } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { formatDate, formatFileSize } from "@/lib/utils";
import {
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";

export default function DocumentationQueuePage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Review Modal
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<DocumentStatus>("approved");
  const [reviewComments, setReviewComments] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Preview Modal
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await documentsApi.listDocuments({
        status: statusFilter ? (statusFilter as DocumentStatus) : undefined,
      });
      setDocuments(res.items || []);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [statusFilter]);

  const handleOpenReview = (doc: DocumentItem, decision: DocumentStatus) => {
    setSelectedDoc(doc);
    setReviewDecision(decision);
    setReviewComments("");
    setIsReviewModalOpen(true);
  };

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setIsReviewing(true);

    try {
      await documentsApi.reviewDocument(
        selectedDoc.id,
        reviewDecision,
        reviewComments || undefined
      );

      setIsReviewModalOpen(false);
      setFeedback(`Document ${selectedDoc.original_filename} has been marked as "${reviewDecision}".`);
      await loadDocuments();
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setIsReviewing(false);
    }
  };

  const handlePreview = async (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setIsLoadingPreview(true);
    setIsPreviewModalOpen(true);

    try {
      const blob = await documentsApi.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch (err) {
      console.error("Failed to fetch document preview", err);
      setPreviewBlobUrl(null);
    } finally {
      setIsLoadingPreview(false);
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

  const filteredDocs = documents.filter((d) => {
    if (categoryFilter && d.category !== categoryFilter) return false;
    return true;
  });

  return (
    <DashboardShell allowedRoles={["documentation_officer"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Document Verification Queue</h1>
            <p className="text-xs text-slate-500">
              Inspect uploaded student documents, verify official credentials, and record approval feedback.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "", label: "All Review Statuses" },
                { value: "pending", label: "Pending Review" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
          </div>
        </div>

        {feedback && (
          <Alert variant="success" title="Verification Audit Complete">
            {feedback}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-semibold text-slate-700">No documents in this queue</p>
            <p>All items matching the specified filters have been processed.</p>
          </Card>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Document Filename</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Uploaded</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{doc.original_filename}</div>
                      {doc.review_comments && (
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          Note: {doc.review_comments}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 capitalize text-slate-600">{doc.category.replace(/_/g, " ")}</td>
                    <td className="p-3.5 text-slate-500">{formatFileSize(doc.file_size_bytes)}</td>
                    <td className="p-3.5">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="p-3.5 text-slate-500">{formatDate(doc.created_at)}</td>
                    <td className="p-3.5 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[11px] text-indigo-600"
                        onClick={() => handlePreview(doc)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[11px] text-slate-600"
                        onClick={() => handleDownload(doc.id, doc.original_filename)}
                        icon={<Download className="w-3.5 h-3.5" />}
                      >
                        Download
                      </Button>

                      {doc.status === "pending" && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-[11px] bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleOpenReview(doc, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[11px] text-rose-600 hover:bg-rose-50"
                            onClick={() => handleOpenReview(doc, "rejected")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Review Feedback Modal */}
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title={`Document Verification: ${reviewDecision.toUpperCase()}`}
          description={`Submit official decision for ${selectedDoc?.original_filename}`}
        >
          <form onSubmit={handleConfirmReview} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Officer Feedback Comments
              </label>
              <textarea
                rows={3}
                required={reviewDecision === "rejected"}
                placeholder={
                  reviewDecision === "approved"
                    ? "e.g. Verified official high school transcripts and GPA authenticity."
                    : "e.g. Scanned copy is illegible or missing official seal. Please re-upload in high resolution."
                }
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={reviewDecision === "approved" ? "primary" : "danger"}
                size="sm"
                isLoading={isReviewing}
              >
                Confirm {reviewDecision === "approved" ? "Approval" : "Rejection"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* File Preview Modal */}
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
            if (previewBlobUrl) window.URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
          }}
          title={selectedDoc ? `Inspect: ${selectedDoc.original_filename}` : "Document Preview"}
          description={selectedDoc ? `Category: ${selectedDoc.category}` : ""}
          maxWidth="4xl"
        >
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : !previewBlobUrl ? (
            <div className="text-center py-12 text-xs text-rose-500">
              Failed to load preview for this file.
            </div>
          ) : selectedDoc?.mime_type === "application/pdf" ? (
            <iframe
              src={previewBlobUrl}
              className="w-full h-[65vh] rounded-lg border border-slate-200"
              title="PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center max-h-[65vh] overflow-hidden bg-slate-900 rounded-lg p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewBlobUrl}
                alt={selectedDoc?.original_filename}
                className="max-h-[60vh] max-w-full object-contain rounded"
              />
            </div>
          )}
        </Modal>
      </div>
    </DashboardShell>
  );
}
