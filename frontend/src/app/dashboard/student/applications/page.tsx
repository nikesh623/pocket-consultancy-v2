"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { applicationsApi } from "@/lib/api/applications";
import { Application, ApplicationDetailResponse, ApplicationStatus } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  History,
  Layers,
  Loader2,
  TrendingUp,
} from "lucide-react";

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<ApplicationDetailResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const res = await applicationsApi.listApplications();
      setApplications(res.items || []);
    } catch (err) {
      console.error("Failed to load applications", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleOpenDetail = async (appId: string) => {
    setIsLoadingDetail(true);
    setIsDetailModalOpen(true);
    try {
      const detail = await applicationsApi.getApplicationDetail(appId);
      setSelectedDetail(detail);
    } catch (err) {
      console.error("Failed to load application detail", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const STAGES: { status: ApplicationStatus; label: string }[] = [
    { status: "submitted", label: "Submitted" },
    { status: "under_review", label: "Under Review" },
    { status: "conditional_offer", label: "Conditional Offer" },
    { status: "unconditional_offer", label: "Unconditional Offer" },
    { status: "visa_processing", label: "Visa Processing" },
    { status: "enrolled", label: "Enrolled" },
  ];

  return (
    <DashboardShell allowedRoles={["student"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Application Progress Tracker</h1>
            <p className="text-xs text-slate-500">
              Track status progressions, offer letters, visa milestones, and immutable status audit history.
            </p>
          </div>
          <Link href="/dashboard/student/shortlist">
            <Button variant="outline" size="sm" icon={<Layers className="w-4 h-4" />}>
              View Shortlisted Programs
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : applications.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <TrendingUp className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No applications on record</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&apos;t submitted any university applications yet. Save courses to your shortlist to apply.
            </p>
            <Link href="/dashboard/student/matches">
              <Button variant="primary" size="sm">
                Explore Recommended Matches
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="p-5 hover:border-slate-300 transition-colors">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{app.reference_number}</span>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-xs text-slate-600">
                      Target Intake: <strong className="text-slate-800">{app.intake_period}</strong> • Submitted{" "}
                      {formatDate(app.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleOpenDetail(app.id)}
                      icon={<History className="w-3.5 h-3.5" />}
                    >
                      Status History & Audit Log
                    </Button>
                  </div>
                </div>

                {/* Progress Pipeline Visualization */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {STAGES.map((s, idx) => {
                      const isCurrent = app.status === s.status;
                      const isPast =
                        STAGES.findIndex((st) => st.status === app.status) >= idx;
                      return (
                        <div
                          key={s.status}
                          className={`rounded-lg p-2 text-center border text-[11px] font-semibold transition-colors ${
                            isCurrent
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : isPast
                              ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                              : "bg-slate-50 border-slate-200 text-slate-400"
                          }`}
                        >
                          {s.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Detailed Application & History Audit Modal */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={selectedDetail ? `Application ${selectedDetail.application.reference_number}` : "Loading Details..."}
          description="Status transitions and officer audit history"
          maxWidth="2xl"
        >
          {isLoadingDetail || !selectedDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Current Status:</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedDetail.application.status} />
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Intake Period:</span>
                  <p className="font-bold text-slate-900 mt-1">{selectedDetail.application.intake_period}</p>
                </div>
                <div>
                  <span className="text-slate-500">Submission Date:</span>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {formatDate(selectedDetail.application.created_at)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Last Updated:</span>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {formatDate(selectedDetail.application.updated_at)}
                  </p>
                </div>
              </div>

              {/* Status Audit History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Status Audit History</span>
                </h4>

                {selectedDetail.history.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No historical transitions recorded yet.</p>
                ) : (
                  <div className="space-y-2 border-l-2 border-indigo-200 ml-2 pl-4">
                    {selectedDetail.history.map((h) => (
                      <div key={h.id} className="relative space-y-1 text-xs">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 capitalize">
                            {h.to_status.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateTime(h.created_at)}
                          </span>
                        </div>
                        {h.remarks && <p className="text-slate-600">{h.remarks}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardShell>
  );
}
