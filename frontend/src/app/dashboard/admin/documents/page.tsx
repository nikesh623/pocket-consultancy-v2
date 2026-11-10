"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { documentsApi } from "@/lib/api/documents";
import { DocumentItem, DocumentStatus } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatDate, formatFileSize } from "@/lib/utils";
import { Download, FileCheck2, Loader2 } from "lucide-react";

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

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
    <DashboardShell allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Document Management & Auditing</h1>
            <p className="text-xs text-slate-500">
              Global repository of uploaded student credentials and verification decisions.
            </p>
          </div>

          <div className="w-full sm:w-56">
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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : documents.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-400 space-y-2">
            <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No documents found matching current review status.</p>
          </Card>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Filename</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Reviewer Remarks</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{d.original_filename}</td>
                    <td className="p-3.5 capitalize text-slate-600">{d.category.replace(/_/g, " ")}</td>
                    <td className="p-3.5 text-slate-500">{formatFileSize(d.file_size_bytes)}</td>
                    <td className="p-3.5">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">{d.review_comments || "—"}</td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px]"
                        onClick={() => handleDownload(d.id, d.original_filename)}
                        icon={<Download className="w-3.5 h-3.5" />}
                      >
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
