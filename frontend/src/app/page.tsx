import React from "react";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  FileCheck2,
  Globe2,
  GraduationCap,
  Layers,
  Lock,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react";

export default function LandingPage() {
  const destinations = [
    {
      country: "United States",
      code: "US",
      currency: "USD",
      highlight: "World-class STEM and global research powerhouses",
      universities: ["Stanford University", "MIT", "Columbia"],
    },
    {
      country: "United Kingdom",
      code: "UK",
      currency: "GBP",
      highlight: "Historic institutions with fast-track 1-year master's degrees",
      universities: ["University of Oxford", "Imperial College", "UCL"],
    },
    {
      country: "Canada",
      code: "CA",
      currency: "CAD",
      highlight: "Generous post-graduation work permits and high quality of life",
      universities: ["University of Toronto", "UBC", "McGill"],
    },
    {
      country: "Australia",
      code: "AU",
      currency: "AUD",
      highlight: "Vibrant multicultural cities and internationally ranked programs",
      universities: ["University of Melbourne", "USYD", "UNSW"],
    },
    {
      country: "Germany",
      code: "DE",
      currency: "EUR",
      highlight: "Renowned engineering and subsidized tuition public universities",
      universities: ["Technical University of Munich", "Heidelberg", "RWTH Aachen"],
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Complete Academic Profile",
      description: "Submit your GPA, qualifications, preferred destinations, and available budget in your student workspace.",
      icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
    },
    {
      number: "02",
      title: "Rule-Based Course Matching",
      description: "Receive instant recommendations categorized into matches, needs review, or insufficient data with clear eligibility explanations.",
      icon: <Layers className="w-5 h-5 text-indigo-600" />,
    },
    {
      number: "03",
      title: "1-on-1 Counselor Sessions",
      description: "Book appointments with assigned counselors based on real-time calendar availability slots.",
      icon: <CalendarCheck className="w-5 h-5 text-indigo-600" />,
    },
    {
      number: "04",
      title: "Document Verification",
      description: "Upload transcripts, passports, and language certificates with client & magic-byte validation for officer review.",
      icon: <FileCheck2 className="w-5 h-5 text-indigo-600" />,
    },
    {
      number: "05",
      title: "Track Application Journey",
      description: "Progress through offer letters, visa processing, and final university enrollment with complete audit history.",
      icon: <TrendingUp className="w-5 h-5 text-indigo-600" />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <LandingNavbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-100/60 to-transparent blur-3xl pointer-events-none -z-10" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Headlines & CTA */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-800 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pocket Consultancy V2 — Role-Based Management</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                  Your Journey to{" "}
                  <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                    Global Education
                  </span>{" "}
                  Starts Here.
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Discover study opportunities, connect with counselors, manage your documents, and track
                  your application journey through one intelligent education consultancy platform.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link href="/register" className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto shadow-md shadow-indigo-300"
                      icon={<UserCheck className="w-5 h-5" />}
                    >
                      Get Started
                    </Button>
                  </Link>
                  <Link href="#destinations" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                      icon={<Globe2 className="w-5 h-5 text-indigo-600" />}
                    >
                      Explore Destinations
                    </Button>
                  </Link>
                </div>

                <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Rule-Based Matching</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified Officers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Argon2 & JWT Security</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Mockup Card */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        PC
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Student Portal Preview</h4>
                        <p className="text-xs text-slate-500">Live Course Eligibility</p>
                      </div>
                    </div>
                    <Badge variant="success">Active Session</Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-900">
                          MSc Computer Science & AI
                        </span>
                        <Badge variant="success" size="sm">
                          Match
                        </Badge>
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-1">
                        Stanford University (US) • Tuition: $58,000 USD
                      </p>
                      <p className="text-[10px] text-emerald-600 mt-1">
                        ✓ Academic score 88% exceeds minimum requirement of 85%.
                      </p>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-900">
                          MSc Advanced Computer Science
                        </span>
                        <Badge variant="warning" size="sm">
                          Needs Review
                        </Badge>
                      </div>
                      <p className="text-[11px] text-amber-700 mt-1">
                        University of Oxford (UK) • Tuition: £38,000 GBP
                      </p>
                      <p className="text-[10px] text-amber-600 mt-1">
                        ⚠ Tuition exceeds student stated budget of £30,000.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800">
                          Scheduled Counseling
                        </span>
                        <span className="text-[11px] font-medium text-indigo-600">Tomorrow, 10:00 AM</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Advisor: Sarah Jenkins (Senior Counselor)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Multi-stage Application Pipeline</span>
                    <Link
                      href="/login"
                      className="text-indigo-600 font-semibold hover:text-indigo-700 inline-flex items-center gap-1"
                    >
                      Sign In to Test <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES SECTION */}
        <section id="features" className="py-20 bg-white border-y border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Full-Stack Architecture
              </h2>
              <h3 className="text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight">
                Designed for Students, Counselors, and Officers
              </h3>
              <p className="text-slate-600 text-sm sm:text-base">
                Four dedicated workspaces with role-based access control, atomic workflows, and reliable
                FastAPI asynchronous database communication.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 space-y-4 hover:border-indigo-300 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Layers className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Rule-Based Course Matching</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Transparent eligibility calculations considering student GPA, intended study level,
                  preferred countries, and tuition budget with plain-text reasons.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 space-y-4 hover:border-indigo-300 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Counselor Appointments</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Counselors publish availability slots; students book appointments with notes. Support for
                  confirmations, cancellations, and private counselor dossiers.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 space-y-4 hover:border-indigo-300 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-sm">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Verified Document Inspection</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload PDF and images (max 5MB) verified via magic-byte signatures. Documentation
                  officers inspect files and record approval/rejection with feedback.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 space-y-4 hover:border-indigo-300 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Multi-Stage Applications</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Structured status progression from draft to enrolled with immutable audit history,
                  timestamps, and reviewer attribution.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS PROCESS */}
        <section id="process" className="py-20 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Consultancy Workflow
              </h2>
              <h3 className="text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight">
                How the Platform Works
              </h3>
              <p className="text-slate-600 text-sm sm:text-base">
                A structured, step-by-step path designed to guide students from initial registration to
                visa approval and campus enrollment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {steps.map((s) => (
                <div
                  key={s.number}
                  className="relative rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl font-black text-indigo-600/30">{s.number}</span>
                  <div className="flex items-center gap-2">
                    {s.icon}
                    <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STUDY DESTINATIONS EXPLORER */}
        <section id="destinations" className="py-20 bg-white border-t border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Top Destinations
                </h2>
                <h3 className="text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight mt-1">
                  Explore Global Study Destinations
                </h3>
                <p className="text-slate-600 text-sm mt-2">
                  Browse leading universities and degree programs supported on Pocket Consultancy V2.
                </p>
              </div>
              <Link href="/register">
                <Button variant="outline" size="sm" icon={<BookOpen className="w-4 h-4" />}>
                  Join as Student
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map((d) => (
                <div
                  key={d.code}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-6 space-y-4 hover:border-indigo-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-slate-900">{d.country}</span>
                    <Badge variant="indigo">{d.currency}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{d.highlight}</p>
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
                    <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                      Featured Institutions:
                    </span>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {d.universities.map((u) => (
                        <li key={u} className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          <span>{u}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST & SECURITY */}
        <section id="trust" className="py-20 bg-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <Badge variant="indigo" className="bg-indigo-950 text-indigo-300 border-indigo-800">
                Enterprise Standards
              </Badge>
              <h3 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
                Built with Rigorous Application Security
              </h3>
              <p className="text-slate-400 text-sm sm:text-base">
                Your data and documents are protected with production-grade cryptography and access control.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 space-y-3">
                <Lock className="w-6 h-6 text-indigo-400" />
                <h4 className="text-base font-bold text-white">Argon2 Password Security</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Industry-leading Argon2 hashing for credentials with zero plaintext exposure across all
                  routes and database logs.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 space-y-3">
                <FileCheck2 className="w-6 h-6 text-indigo-400" />
                <h4 className="text-base font-bold text-white">Magic-Byte File Inspection</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  File uploads undergo header signature inspection rather than trusting client extensions,
                  enforcing strict 5MB limits.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 space-y-3">
                <UserCheck className="w-6 h-6 text-indigo-400" />
                <h4 className="text-base font-bold text-white">Admin Approval Gate</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Student registrations start in pending status and require administrator verification before
                  authenticated access is granted.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="py-20 bg-gradient-to-tr from-indigo-600 to-blue-700 text-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Ready to Accelerate Your Global Education Journey?
            </h2>
            <p className="text-indigo-100 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Join students who use Pocket Consultancy V2 to discover accredited courses, consult verified
              advisors, and track their international study applications.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto bg-white text-indigo-950 hover:bg-slate-100 shadow-lg"
                  icon={<UserCheck className="w-5 h-5 text-indigo-600" />}
                >
                  Create Student Account
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-indigo-300 text-white hover:bg-white/10"
                >
                  Sign In to Workspace
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
