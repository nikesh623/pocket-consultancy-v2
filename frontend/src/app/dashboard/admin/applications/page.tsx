"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { applicationsApi } from "@/lib/api/applications";
import { Application, ApplicationDetailResponse, ApplicationStatus } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Clock, History, Loader2, TrendingUp } from "lucide-react";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Status Transition Modal
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus>("under_review");
  const [transitionRemarks, setTransitionRemarks] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // History Detail Modal
  const [selectedDetail, setSelectedDetail] = useState<ApplicationDetailResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const res = await applicationsApi.listApplications({
        status: statusFilter ? (statusFilter as ApplicationStatus) : undefined,
      });
      setApplications(res.items || []);
    } catch (err) {
      console.error("Failed to load applications", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const handleOpenTransition = (app: Application) => {
    setSelectedApp(app);
    setTransitionError(null);
    setTransitionRemarks("");
    setIsTransitionModalOpen(true);
  };

  const handleOpenHistory = async (appId: string) => {
    setIsLoadingDetail(true);
    setIsDetailModalOpen(true);
    try {
      const detail = await applicationsApi.getApplicationDetail(appId);
      setSelectedDetail(detail);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleConfirmTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setIsTransitioning(true);
    setTransitionError(null);

    try {
      await applicationsApi.transitionStatus(
        selectedApp.id,
        targetStatus,
        transitionRemarks || undefined
      );

      setIsTransitionModalOpen(false);
      setFeedback(`Application ${selectedApp.reference_number} transitioned to "${targetStatus}".`);
      await loadApplications();
    } catch (err: unknown) {
      setTransitionError(err instanceof Error ? err.message : "Failed to transition status.");
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <DashboardShell allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Application Oversight & Transitions</h1>
            <p className="text-xs text-slate-500">
              Progress institutional applications through multi-stage review, offer issuance, and visa steps.
            </p>
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "", label: "All Application Statuses" },
                { value: "draft", label: "Draft" },
                { value: "submitted", label: "Submitted" },
                { value: "under_review", label: "Under Review" },
                { value: "conditional_offer", label: "Conditional Offer" },
                { value: "unconditional_offer", label: "Unconditional Offer" },
                { value: "visa_processing", label: "Visa Processing" },
                { value: "enrolled", label: "Enrolled" },
                { value: "rejected", label: "Rejected" },
                { value: "withdrawn", label: "Withdrawn" },
              ]}
            />
          </div>
        </div>

        {feedback && (
          <Alert variant="success" title="Application Progressed">
            {feedback}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : applications.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-400 space-y-2">
            <TrendingUp className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No applications found matching the selected filter.</p>
          </Card>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Reference Number</th>
                  <th className="p-3.5">Intake Period</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Submitted</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{app.reference_number}</td>
                    <td className="p-3.5 text-slate-700">{app.intake_period}</td>
                    <td className="p-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="p-3.5 text-slate-500">{formatDate(app.created_at)}</td>
                    <td className="p-3.5 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[11px] text-slate-600"
                        onClick={() => handleOpenHistory(app.id)}
                        icon={<History className="w-3.5 h-3.5" />}
                      >
                        History
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-[11px]"
                        onClick={() => handleOpenTransition(app)}
                      >
                        Progress Status
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Transition Status Modal */}
        <Modal
          isOpen={isTransitionModalOpen}
          onClose={() => setIsTransitionModalOpen(false)}
          title={`Progress Status: ${selectedApp?.reference_number}`}
          description="Update application lifecycle state with audit remarks"
        >
          <form onSubmit={handleConfirmTransition} className="space-y-4">
            {transitionError && (
              <Alert variant="destructive" title="Transition Error">
                {transitionError}
              </Alert>
            )}

            <Select
              label="Select Target Status"
              required
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as ApplicationStatus)}
              options={[
                { value: "under_review", label: "Under Review" },
                { value: "conditional_offer", label: "Conditional Offer" },
                { value: "unconditional_offer", label: "Unconditional Offer" },
                { value: "visa_processing", label: "Visa Processing" },
                { value: "enrolled", label: "Enrolled (Final)" },
                { value: "rejected", label: "Rejected" },
                { value: "withdrawn", label: "Withdrawn" },
              ]}
            />

            <Input
              label="Audit Remarks / Official Notes"
              placeholder="e.g. Official unconditional admission letter received from university admissions."
              value={transitionRemarks}
              onChange={(e) => setTransitionRemarks(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsTransitionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isTransitioning}>
                Confirm Transition
              </Button>
            </div>
          </form>
        </Modal>

        {/* Audit History Modal */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Application Status History Audit"
          description={selectedDetail?.application.reference_number || ""}
        >
          {isLoadingDetail || !selectedDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 border-l-2 border-indigo-200 ml-2 pl-4">
                {selectedDetail.history.map((h) => (
                  <div key={h.id} className="relative space-y-1 text-xs">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 capitalize">
                        {h.from_status} → {h.to_status}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDateTime(h.created_at)}</span>
                    </div>
                    {h.remarks && <p className="text-slate-600">{h.remarks}</p>}
                  </div>
                ))}
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
