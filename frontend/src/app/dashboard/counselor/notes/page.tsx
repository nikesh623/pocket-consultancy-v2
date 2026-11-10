"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { studentsApi } from "@/lib/api/students";
import { CounselorNote, User } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { formatDateTime } from "@/lib/utils";
import { FileText, Loader2, Plus, Sparkles } from "lucide-react";

export default function CounselorNotesPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [notes, setNotes] = useState<CounselorNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await studentsApi.getAssignedStudents();
        setStudents(res.items || []);
        if ((res.items || []).length > 0) {
          setSelectedStudentId(res.items[0].id);
        }
      } catch (err) {
        console.error("Failed to load assigned students", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudents();
  }, []);

  const loadNotesForStudent = async (studentId: string) => {
    if (!studentId) return;
    setIsLoadingNotes(true);
    try {
      const res = await studentsApi.getCounselorNotes(studentId);
      setNotes(res.items || []);
    } catch (err) {
      console.error("Failed to load notes", err);
      setNotes([]);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      loadNotesForStudent(selectedStudentId);
    }
  }, [selectedStudentId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !newNoteContent.trim()) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      await studentsApi.addCounselorNote(selectedStudentId, newNoteContent);
      setNewNoteContent("");
      setFeedback("Advisory note saved to student dossier.");
      await loadNotesForStudent(selectedStudentId);
    } catch (err) {
      console.error("Failed to save note", err);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <DashboardShell allowedRoles={["counselor"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Private Counselor Notes</h1>
          <p className="text-xs text-slate-500">
            Record private counseling observations, interview notes, and institutional guidance for assigned students.
          </p>
        </div>

        {feedback && (
          <Alert variant="success" title="Note Saved">
            {feedback}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : students.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-400 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No assigned students available to attach notes to.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Student Selector & Add Note Form */}
            <div className="space-y-4">
              <Card className="p-5 space-y-4">
                <Select
                  label="Select Student Dossier"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  options={students.map((s) => ({
                    value: s.id,
                    label: `${s.full_name} (${s.email})`,
                  }))}
                />

                <form onSubmit={handleAddNote} className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Add Advisory Observation
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="e.g. Student prefers 1-year master's programs in UK; suggested IELTS score retake to meet Oxford 7.5 requirement..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full"
                    isLoading={isSaving}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Save Private Note
                  </Button>
                </form>
              </Card>
            </div>

            {/* Right Column: Historical Notes List */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Notes for {selectedStudent?.full_name || "Selected Student"}</span>
              </h3>

              {isLoadingNotes ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : notes.length === 0 ? (
                <Card className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <FileText className="w-6 h-6 mx-auto text-slate-300" />
                  <p>No notes recorded for this student yet.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <Card key={n.id} className="p-4 space-y-2 bg-white">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-100 pb-1.5">
                        <span className="font-semibold text-slate-700">Counselor Observation</span>
                        <span>{formatDateTime(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {n.note_content}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
