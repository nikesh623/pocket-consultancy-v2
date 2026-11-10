"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { studentsApi } from "@/lib/api/students";
import { StudentProfile, User } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Eye, GraduationCap, Loader2, Mail, Phone, Users } from "lucide-react";

export default function CounselorStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Inspection Modal
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadAssigned() {
      try {
        const res = await studentsApi.getAssignedStudents();
        setStudents(res.items || []);
      } catch (err) {
        console.error("Failed to load assigned students", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAssigned();
  }, []);

  const handleInspectProfile = async (student: User) => {
    setSelectedStudent(student);
    setIsLoadingProfile(true);
    setIsModalOpen(true);

    try {
      const prof = await studentsApi.getStudentProfileById(student.id);
      setProfile(prof);
    } catch (err) {
      console.error("Failed to load profile", err);
      setProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  return (
    <DashboardShell allowedRoles={["counselor"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assigned Students Dossier</h1>
          <p className="text-xs text-slate-500">
            Review academic dossiers, scores, and country preferences for students assigned to your guidance.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : students.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No students currently assigned to your counselor account.</p>
            <p className="text-slate-500">An administrator assigns prospective students from the user management console.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((s) => (
              <Card key={s.id} className="p-4 space-y-3 hover:border-blue-300 transition-colors">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{s.full_name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.email}</span>
                  </div>
                  {s.phone_number && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.phone_number}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Enrolled {formatDate(s.created_at)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleInspectProfile(s)}
                    icon={<Eye className="w-3.5 h-3.5" />}
                  >
                    View Dossier
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Profile Inspection Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedStudent ? `Student Dossier: ${selectedStudent.full_name}` : ""}
          description="Academic qualifications, scores, and preferences"
          maxWidth="xl"
        >
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : !profile ? (
            <div className="text-center py-8 text-xs text-slate-400">
              <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>Student has not yet completed their academic profile.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">Highest Qualification:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{profile.highest_qualification || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Institution:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{profile.institution_name || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Academic Score:</span>
                  <p className="font-bold text-indigo-700 mt-0.5">
                    {profile.academic_score ? `${profile.academic_score}%` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Intended Study Level:</span>
                  <p className="font-bold text-slate-900 capitalize mt-0.5">
                    {profile.intended_study_level || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Annual Tuition Budget:</span>
                  <p className="font-bold text-emerald-700 mt-0.5">
                    {formatCurrency(profile.budget_amount, profile.budget_currency)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Target Field:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{profile.intended_course || "—"}</p>
                </div>
              </div>

              {profile.preferred_countries && profile.preferred_countries.length > 0 && (
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Preferred Destinations:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.preferred_countries.map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
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
