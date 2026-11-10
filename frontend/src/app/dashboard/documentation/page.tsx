"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { documentsApi } from "@/lib/api/documents";
import { DocumentItem } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, formatFileSize } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  FileText,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";

export default function DocumentationDashboardPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDocs() {
      try {
        const res = await documentsApi.listDocuments({ limit: 100 });
        setDocuments(res.items || []);
      } catch (err) {
        console.error("Failed to load documents", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDocs();
  }, []);

  const pendingDocs = documents.filter((d) => d.status === "pending");
  const approvedDocs = documents.filter((d) => d.status === "approved");
  const rejectedDocs = documents.filter((d) => d.status === "rejected");

  return (
    <DashboardShell allowedRoles={["documentation_officer"]}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 px-3 py-0.5 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verification Officer Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.full_name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Inspect uploaded student credentials, review academic transcripts, and record official approval
              or rejection verification audits.
            </p>
          </div>
        </div>

        {/* Verification Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-800 font-semibold">Pending Verification</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingDocs.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting inspection</p>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-600">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Approved Documents</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{approvedDocs.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Verified authentic</p>
          </Card>

          <Card className="p-4 border-l-4 border-l-rose-600">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Rejected Documents</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{rejectedDocs.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Requires re-upload</p>
          </Card>
        </div>

        {/* Pending Verification Priority Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Priority Verification Queue</CardTitle>
              <CardDescription>Submitted documents awaiting review</CardDescription>
            </div>
            <Link href="/dashboard/documentation/queue">
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600">
                Open Full Queue <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : pendingDocs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-semibold text-slate-700">Verification queue is up to date!</p>
                <p>No documents currently awaiting review.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingDocs.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{doc.original_filename}</span>
                        <StatusBadge status={doc.status} />
                      </div>
                      <p className="text-xs text-slate-500">
                        Category: <strong className="text-slate-700 capitalize">{doc.category.replace(/_/g, " ")}</strong> • Size:{" "}
                        {formatFileSize(doc.file_size_bytes)} • Uploaded {formatDate(doc.created_at)}
                      </p>
                    </div>

                    <Link href="/dashboard/documentation/queue">
                      <Button variant="primary" size="sm" className="text-xs">
                        Inspect & Review
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
