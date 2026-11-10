"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { studentsApi } from "@/lib/api/students";
import { destinationsApi } from "@/lib/api/destinations";
import { Country, StudentProfile, StudyLevel } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Check, CheckCircle2, GraduationCap, Loader2, Save, Sparkles } from "lucide-react";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<Partial<StudentProfile>>({
    highest_qualification: "",
    institution_name: "",
    academic_score: undefined,
    score_type: "percentage",
    intended_study_level: "postgraduate",
    intended_course: "",
    preferred_countries: [],
    budget_amount: undefined,
    budget_currency: "USD",
    nationality: "",
    address: "",
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [profData, countriesData] = await Promise.all([
          studentsApi.getOwnProfile().catch(() => null),
          destinationsApi.listCountries(),
        ]);

        if (profData) {
          setProfile(profData);
        }
        setCountries(countriesData.items || []);
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  const handleCountryToggle = (code: string) => {
    const current = profile.preferred_countries || [];
    if (current.includes(code)) {
      setProfile({ ...profile, preferred_countries: current.filter((c) => c !== code) });
    } else {
      setProfile({ ...profile, preferred_countries: [...current, code] });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const updated = await studentsApi.upsertOwnProfile({
        highest_qualification: profile.highest_qualification,
        institution_name: profile.institution_name,
        academic_score: profile.academic_score ? Number(profile.academic_score) : null,
        score_type: profile.score_type,
        intended_study_level: profile.intended_study_level as StudyLevel,
        intended_course: profile.intended_course,
        preferred_countries: profile.preferred_countries,
        budget_amount: profile.budget_amount ? Number(profile.budget_amount) : null,
        budget_currency: profile.budget_currency,
        nationality: profile.nationality,
        address: profile.address,
      });

      setProfile(updated);
      setSuccessMessage("Academic profile successfully updated! You can now run course matching.");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell allowedRoles={["student"]}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell allowedRoles={["student"]}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Profile & Preferences</h1>
          <p className="text-xs text-slate-500 mt-1">
            Keep your academic background and study intentions up to date to receive transparent course matches.
          </p>
        </div>

        {successMessage && (
          <Alert variant="success" title="Profile Saved">
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive" title="Error Saving Profile">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Academic Background */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <CardTitle>Academic Qualifications</CardTitle>
              </div>
              <CardDescription>Details evaluated by the rule-based course matching engine</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Highest Completed Qualification"
                required
                placeholder="e.g. Bachelor of Science in Computing"
                value={profile.highest_qualification || ""}
                onChange={(e) => setProfile({ ...profile, highest_qualification: e.target.value })}
              />

              <Input
                label="Institution / University Name"
                placeholder="e.g. Kathmandu University"
                value={profile.institution_name || ""}
                onChange={(e) => setProfile({ ...profile, institution_name: e.target.value })}
              />

              <Input
                label="Academic Score / GPA / Percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                placeholder="e.g. 82.5"
                value={profile.academic_score ?? ""}
                onChange={(e) => setProfile({ ...profile, academic_score: e.target.value ? Number(e.target.value) : undefined })}
                helperText="Percentage score (0-100) used for minimum course requirement checking"
              />

              <Select
                label="Score Metric"
                value={profile.score_type || "percentage"}
                onChange={(e) => setProfile({ ...profile, score_type: e.target.value })}
                options={[
                  { value: "percentage", label: "Percentage (%)" },
                  { value: "gpa_4", label: "GPA (4.0 Scale)" },
                  { value: "cgpa_10", label: "CGPA (10.0 Scale)" },
                ]}
              />
            </CardContent>
          </Card>

          {/* Section 2: Study Intentions & Budget */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <CardTitle>Study Intentions & Financial Budget</CardTitle>
              </div>
              <CardDescription>Determine matching programs and verify financial feasibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Intended Study Level"
                  required
                  value={profile.intended_study_level || "postgraduate"}
                  onChange={(e) => setProfile({ ...profile, intended_study_level: e.target.value as StudyLevel })}
                  options={[
                    { value: "undergraduate", label: "Undergraduate (Bachelor's)" },
                    { value: "postgraduate", label: "Postgraduate (Master's)" },
                    { value: "doctorate", label: "Doctorate (Ph.D.)" },
                    { value: "diploma", label: "Diploma Program" },
                    { value: "certificate", label: "Certificate" },
                  ]}
                />

                <Input
                  label="Target Course / Field of Study"
                  placeholder="e.g. Computer Science, Business Analytics"
                  value={profile.intended_course || ""}
                  onChange={(e) => setProfile({ ...profile, intended_course: e.target.value })}
                />

                <Input
                  label="Maximum Tuition Budget (Per Annum)"
                  type="number"
                  step="100"
                  min="0"
                  placeholder="e.g. 45000"
                  value={profile.budget_amount ?? ""}
                  onChange={(e) => setProfile({ ...profile, budget_amount: e.target.value ? Number(e.target.value) : undefined })}
                />

                <Select
                  label="Budget Currency"
                  value={profile.budget_currency || "USD"}
                  onChange={(e) => setProfile({ ...profile, budget_currency: e.target.value })}
                  options={[
                    { value: "USD", label: "USD ($) - US Dollar" },
                    { value: "GBP", label: "GBP (£) - British Pound" },
                    { value: "CAD", label: "CAD ($) - Canadian Dollar" },
                    { value: "AUD", label: "AUD ($) - Australian Dollar" },
                    { value: "EUR", label: "EUR (€) - Euro" },
                  ]}
                />
              </div>

              {/* Preferred Study Countries Multi-select */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Preferred Study Destinations
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {countries.map((c) => {
                    const isSelected = profile.preferred_countries?.includes(c.code);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => handleCountryToggle(c.code)}
                        className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span>{c.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal & Contact Details</CardTitle>
              <CardDescription>Used for institutional applications and communication</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nationality"
                placeholder="e.g. Nepali, Canadian"
                value={profile.nationality || ""}
                onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
              />

              <Input
                label="Residential Address"
                placeholder="e.g. Kathmandu, Bagmati"
                value={profile.address || ""}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              Save Academic Profile
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
