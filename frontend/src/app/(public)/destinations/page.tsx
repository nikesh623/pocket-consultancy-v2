"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { destinationsApi } from "@/lib/api/destinations";
import { coursesApi } from "@/lib/api/courses";
import { Country, Course, University } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { BookOpen, Globe2, GraduationCap, Loader2, Search, UserCheck } from "lucide-react";

export default function DestinationsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, crsRes] = await Promise.all([
          destinationsApi.listCountries(),
          coursesApi.listCourses({ size: 20 }),
        ]);
        setCountries(cRes.items || []);
        setCourses(crsRes.items || []);
      } catch (err) {
        console.error("Failed to load destinations", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = selectedCountry ? c.country_id === selectedCountry : true;
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <LandingNavbar />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="space-y-3 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Globe2 className="w-3.5 h-3.5" />
              <span>Global Educational Programs</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Study Destinations & Courses
            </h1>
            <p className="text-sm text-slate-600">
              Explore accredited undergraduate and postgraduate programs across top study destinations.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search programs, disciplines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setSelectedCountry("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCountry === ""
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Destinations
              </button>
              {countries.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCountry(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedCountry === c.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Course Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No programs match your search</h3>
              <p className="text-xs text-slate-500">Try adjusting your destination filter or search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((crs) => (
                <Card key={crs.id} className="flex flex-col justify-between hover:border-indigo-400 transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="indigo" size="sm" className="capitalize">
                        {crs.study_level}
                      </Badge>
                      <span className="text-xs font-bold text-slate-900">
                        {formatCurrency(crs.tuition_fee, crs.currency)}
                      </span>
                    </div>
                    <CardTitle className="text-base">{crs.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Duration: {crs.duration_months} Months • Min Academic Score: {crs.min_academic_score || "N/A"}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {crs.description || crs.entry_requirements || "Entry requirements available in application packet."}
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <Link href="/register" className="w-full">
                        <Button variant="outline" size="sm" className="w-full" icon={<UserCheck className="w-4 h-4" />}>
                          Apply via Student Portal
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
