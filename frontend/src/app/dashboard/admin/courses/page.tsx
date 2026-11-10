"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { coursesApi } from "@/lib/api/courses";
import { destinationsApi } from "@/lib/api/destinations";
import { Country, Course, StudyLevel, University } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { BookOpen, Loader2, Plus, Search } from "lucide-react";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal: Add Course
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newUnivId, setNewUnivId] = useState("");
  const [newCountryId, setNewCountryId] = useState("");
  const [newStudyLevel, setNewStudyLevel] = useState<StudyLevel>("postgraduate");
  const [newDuration, setNewDuration] = useState(12);
  const [newTuition, setNewTuition] = useState(30000);
  const [newCurrency, setNewCurrency] = useState("USD");
  const [newMinScore, setNewMinScore] = useState<number | undefined>(75);
  const [newEntryReqs, setNewEntryReqs] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [crsRes, cRes, uRes] = await Promise.all([
        coursesApi.listCourses({ size: 100 }),
        destinationsApi.listCountries(),
        destinationsApi.listUniversities({ size: 100 }),
      ]);
      setCourses(crsRes.items || []);
      setCountries(cRes.items || []);
      setUniversities(uRes.items || []);

      if ((cRes.items || []).length > 0 && !newCountryId) {
        setNewCountryId(cRes.items[0].id);
      }
      if ((uRes.items || []).length > 0 && !newUnivId) {
        setNewUnivId(uRes.items[0].id);
      }
    } catch (err) {
      console.error("Failed to load courses data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await coursesApi.createCourse({
        name: newCourseName,
        university_id: newUnivId,
        country_id: newCountryId,
        study_level: newStudyLevel,
        duration_months: Number(newDuration),
        tuition_fee: Number(newTuition),
        currency: newCurrency.toUpperCase(),
        min_academic_score: newMinScore ? Number(newMinScore) : null,
        entry_requirements: newEntryReqs,
        description: newDesc,
      });

      setIsModalOpen(false);
      setNewCourseName("");
      setNewEntryReqs("");
      setNewDesc("");
      setFeedback("Degree program successfully added to catalog.");
      await loadData();
    } catch (err) {
      console.error("Failed to create course", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Course Catalog & Entry Criteria</h1>
            <p className="text-xs text-slate-500">
              Manage degrees, tuition fees, and minimum score criteria powering the matching engine.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Degree Program
          </Button>
        </div>

        {feedback && (
          <Alert variant="success" title="Catalog Updated">
            {feedback}
          </Alert>
        )}

        {/* Search */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search programs by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Courses Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-400 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No courses match your search keywords.</p>
          </Card>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Course Name</th>
                  <th className="p-3.5">Study Level</th>
                  <th className="p-3.5">Tuition Fee</th>
                  <th className="p-3.5">Min Score</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3.5 capitalize">{c.study_level}</td>
                    <td className="p-3.5 font-semibold text-slate-800">
                      {formatCurrency(c.tuition_fee, c.currency)}
                    </td>
                    <td className="p-3.5">{c.min_academic_score ? `${c.min_academic_score}%` : "—"}</td>
                    <td className="p-3.5 text-slate-500">{c.duration_months} Months</td>
                    <td className="p-3.5">
                      <Badge variant={c.is_active ? "success" : "neutral"} size="sm">
                        {c.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Course Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Degree Program"
          description="Register a new academic course in the consultancy catalog"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <Input
              label="Course / Program Name"
              required
              placeholder="e.g. Master of Science in Data Science"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Destination Country"
                required
                value={newCountryId}
                onChange={(e) => setNewCountryId(e.target.value)}
                options={countries.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.code})`,
                }))}
              />

              <Select
                label="University / Institution"
                required
                value={newUnivId}
                onChange={(e) => setNewUnivId(e.target.value)}
                options={universities.map((u) => ({
                  value: u.id,
                  label: u.name,
                }))}
              />

              <Select
                label="Study Level"
                required
                value={newStudyLevel}
                onChange={(e) => setNewStudyLevel(e.target.value as StudyLevel)}
                options={[
                  { value: "undergraduate", label: "Undergraduate" },
                  { value: "postgraduate", label: "Postgraduate" },
                  { value: "doctorate", label: "Doctorate" },
                  { value: "diploma", label: "Diploma" },
                  { value: "certificate", label: "Certificate" },
                ]}
              />

              <Input
                label="Duration (Months)"
                type="number"
                required
                min={1}
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
              />

              <Input
                label="Tuition Fee"
                type="number"
                required
                min={0}
                value={newTuition}
                onChange={(e) => setNewTuition(Number(e.target.value))}
              />

              <Select
                label="Fee Currency"
                required
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value)}
                options={[
                  { value: "USD", label: "USD ($)" },
                  { value: "GBP", label: "GBP (£)" },
                  { value: "CAD", label: "CAD ($)" },
                  { value: "AUD", label: "AUD ($)" },
                  { value: "EUR", label: "EUR (€)" },
                ]}
              />

              <Input
                label="Minimum Academic Score (%)"
                type="number"
                step="0.1"
                placeholder="e.g. 80.0"
                value={newMinScore ?? ""}
                onChange={(e) => setNewMinScore(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <Input
              label="Entry Requirements Summary"
              placeholder="e.g. Bachelor's in CS or Mathematics with GPA 3.2+"
              value={newEntryReqs}
              onChange={(e) => setNewEntryReqs(e.target.value)}
            />

            <Input
              label="Course Description"
              placeholder="e.g. Cutting-edge curriculum focused on statistical modeling and systems..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                Save Course
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}
