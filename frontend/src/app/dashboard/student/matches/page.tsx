"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { studentsApi } from "@/lib/api/students";
import { CourseMatchResponse, CourseMatchResult } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  GraduationCap,
  HelpCircle,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function StudentMatchesPage() {
  const [matchData, setMatchData] = useState<CourseMatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"matches" | "needs_review" | "insufficient_data">("matches");
  const [shortlistStatus, setShortlistStatus] = useState<Record<string, boolean>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadMatches = async () => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const res = await studentsApi.getMatches();
      setMatchData(res);
    } catch (err: unknown) {
      console.error("Failed to load matches", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleAddToShortlist = async (courseId: string, courseName: string) => {
    try {
      await studentsApi.addToShortlist(courseId);
      setShortlistStatus((prev) => ({ ...prev, [courseId]: true }));
      setActionMessage(`"${courseName}" added to your shortlist.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add to shortlist.";
      setActionMessage(msg);
    }
  };

  const getResultsByTab = (): CourseMatchResult[] => {
    if (!matchData) return [];
    switch (activeTab) {
      case "matches":
        return matchData.matches || [];
      case "needs_review":
        return matchData.needs_review || [];
      case "insufficient_data":
        return matchData.insufficient_data || [];
    }
  };

  const currentResults = getResultsByTab();

  return (
    <DashboardShell allowedRoles={["student"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-0.5 text-xs font-semibold text-indigo-700 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparent Rule-Based Heuristics</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Course Recommendation Engine</h1>
            <p className="text-xs text-slate-500">
              Evaluated strictly against entry scores, budget limits, study level, and destination preferences.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/student/profile">
              <Button variant="outline" size="sm" icon={<GraduationCap className="w-4 h-4" />}>
                Edit Profile
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={loadMatches}
              isLoading={isLoading}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Re-evaluate
            </Button>
          </div>
        </div>

        {actionMessage && (
          <Alert variant="info" title="Shortlist Update">
            {actionMessage}
          </Alert>
        )}

        {/* Engine Summary Metrics */}
        {matchData?.summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              onClick={() => setActiveTab("matches")}
              className={`p-4 cursor-pointer transition-all ${
                activeTab === "matches" ? "border-emerald-500 bg-emerald-50/20 shadow-xs" : "hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Direct Matches</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2">{matchData.summary.match_count}</p>
              <p className="text-[11px] text-slate-500 mt-1">Meets all academic & budget criteria</p>
            </Card>

            <Card
              onClick={() => setActiveTab("needs_review")}
              className={`p-4 cursor-pointer transition-all ${
                activeTab === "needs_review" ? "border-amber-500 bg-amber-50/20 shadow-xs" : "hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">Needs Review</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-600 mt-2">{matchData.summary.review_count}</p>
              <p className="text-[11px] text-slate-500 mt-1">Minor criteria variance / budget review</p>
            </Card>

            <Card
              onClick={() => setActiveTab("insufficient_data")}
              className={`p-4 cursor-pointer transition-all ${
                activeTab === "insufficient_data" ? "border-rose-500 bg-rose-50/20 shadow-xs" : "hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">Insufficient Data</span>
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-rose-600 mt-2">{matchData.summary.insufficient_count}</p>
              <p className="text-[11px] text-slate-500 mt-1">Missing required profile criteria</p>
            </Card>

            <Card className="p-4 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Total Evaluated</span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{matchData.summary.total_evaluated}</p>
              <p className="text-[11px] text-slate-500 mt-1">Catalog courses processed</p>
            </Card>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("matches")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "matches"
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Direct Matches ({matchData?.matches?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("needs_review")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "needs_review"
                ? "bg-amber-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Needs Review ({matchData?.needs_review?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("insufficient_data")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "insufficient_data"
                ? "bg-rose-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Insufficient Data ({matchData?.insufficient_data?.length || 0})
          </button>
        </div>

        {/* Results List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : currentResults.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No courses in this category</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Ensure your intended study level, scores, and country preferences are configured in your profile.
            </p>
            <Link href="/dashboard/student/profile">
              <Button variant="outline" size="sm">
                Update Academic Profile
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {currentResults.map((item) => (
              <Card key={item.course_id} className="hover:border-slate-300 transition-colors">
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{item.course_name}</span>
                      <Badge
                        variant={
                          item.status === "matches"
                            ? "success"
                            : item.status === "needs_review"
                            ? "warning"
                            : "danger"
                        }
                        size="sm"
                        className="capitalize"
                      >
                        {item.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-700">
                        {formatCurrency(item.tuition_fee, item.currency)}
                      </span>
                    </div>

                    {/* Explanatory Reasons List */}
                    <div className="space-y-1">
                      {item.reasons.map((r, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 text-xs text-slate-600"
                        >
                          {item.status === "matches" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : item.status === "needs_review" ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          )}
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant={shortlistStatus[item.course_id] ? "soft" : "outline"}
                      size="sm"
                      onClick={() => handleAddToShortlist(item.course_id, item.course_name)}
                      icon={
                        shortlistStatus[item.course_id] ? (
                          <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )
                      }
                    >
                      {shortlistStatus[item.course_id] ? "Shortlisted" : "Add to Shortlist"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
