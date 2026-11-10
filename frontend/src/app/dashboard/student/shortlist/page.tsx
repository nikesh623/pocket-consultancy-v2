"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { studentsApi } from "@/lib/api/students";
import { applicationsApi } from "@/lib/api/applications";
import { coursesApi } from "@/lib/api/courses";
import { Course, ShortlistItem } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";

export default function StudentShortlistPage() {
  const router = useRouter();
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [coursesMap, setCoursesMap] = useState<Record<string, Course>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Application Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [intakePeriod, setIntakePeriod] = useState("Fall 2027");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  const loadShortlist = async () => {
    setIsLoading(true);
    try {
      const res = await studentsApi.getShortlist();
      setShortlist(res.items || []);

      // Fetch course details for items in shortlist
      const courseIds = (res.items || []).map((item) => item.course_id);
      const coursePromises = courseIds.map((id) => coursesApi.getCourse(id).catch(() => null));
      const courseResults = await Promise.all(coursePromises);

      const map: Record<string, Course> = {};
      courseResults.forEach((c) => {
        if (c) map[c.id] = c;
      });
      setCoursesMap(map);
    } catch (err) {
      console.error("Failed to load shortlist", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShortlist();
  }, []);

  const handleRemove = async (courseId: string) => {
    try {
      await studentsApi.removeFromShortlist(courseId);
      setShortlist((prev) => prev.filter((item) => item.course_id !== courseId));
      setFeedback("Course removed from your shortlist.");
    } catch (err) {
      console.error("Failed to remove course", err);
    }
  };

  const handleOpenApply = (course: Course) => {
    setSelectedCourse(course);
    setAppError(null);
    setIsApplyModalOpen(true);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setIsSubmittingApp(true);
    setAppError(null);

    try {
      await applicationsApi.submitApplication({
        course_id: selectedCourse.id,
        university_id: selectedCourse.university_id,
        intake_period: intakePeriod,
      });

      setIsApplyModalOpen(false);
      router.push("/dashboard/student/applications");
    } catch (err: unknown) {
      setAppError(err instanceof Error ? err.message : "Failed to submit application.");
    } finally {
      setIsSubmittingApp(false);
    }
  };

  return (
    <DashboardShell allowedRoles={["student"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shortlisted Programs</h1>
            <p className="text-xs text-slate-500">
              Manage prospective courses before submitting formal university applications.
            </p>
          </div>
          <Link href="/dashboard/student/matches">
            <Button variant="outline" size="sm" icon={<BookOpen className="w-4 h-4" />}>
              Discover More Programs
            </Button>
          </Link>
        </div>

        {feedback && (
          <Alert variant="info" title="Shortlist Update">
            {feedback}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : shortlist.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No courses in your shortlist</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use our course recommendation engine to find programs matching your GPA and budget.
            </p>
            <Link href="/dashboard/student/matches">
              <Button variant="primary" size="sm">
                Explore Recommended Matches
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortlist.map((item) => {
              const course = coursesMap[item.course_id];
              return (
                <Card key={item.id} className="flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="indigo" size="sm" className="capitalize">
                          {course?.study_level || "Degree"}
                        </Badge>
                        <span className="text-xs font-bold text-slate-900">
                          {course ? formatCurrency(course.tuition_fee, course.currency) : "—"}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{course?.name || "Loading Course Details..."}</h3>
                      <p className="text-xs text-slate-500">Saved on {formatDate(item.created_at)}</p>
                    </div>

                    {course?.entry_requirements && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        <strong>Requirements:</strong> {course.entry_requirements}
                      </p>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs"
                        onClick={() => handleRemove(item.course_id)}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Remove
                      </Button>

                      {course && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenApply(course)}
                          icon={<Send className="w-3.5 h-3.5" />}
                        >
                          Submit Application
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Application Submission Dialog */}
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title="Submit University Application"
          description="Initiate your multi-stage application review process"
        >
          {selectedCourse && (
            <form onSubmit={handleSubmitApplication} className="space-y-4">
              {appError && (
                <Alert variant="destructive" title="Application Error">
                  {appError}
                </Alert>
              )}

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-1">
                <span className="text-xs font-bold text-indigo-900">{selectedCourse.name}</span>
                <p className="text-xs text-indigo-700">
                  Tuition: {formatCurrency(selectedCourse.tuition_fee, selectedCourse.currency)} • Duration:{" "}
                  {selectedCourse.duration_months} Months
                </p>
              </div>

              <Select
                label="Target Intake Period"
                required
                value={intakePeriod}
                onChange={(e) => setIntakePeriod(e.target.value)}
                options={[
                  { value: "Fall 2027", label: "Fall 2027 (September)" },
                  { value: "Spring 2027", label: "Spring 2027 (January)" },
                  { value: "Summer 2027", label: "Summer 2027 (May)" },
                  { value: "Fall 2028", label: "Fall 2028 (September)" },
                ]}
              />

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                Submitting an application creates a formal reference number and initial status audit. Your
                assigned counselor and documentation officer will track offer letters and visa milestones.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsApplyModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingApp}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Confirm & Submit
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </DashboardShell>
  );
}
